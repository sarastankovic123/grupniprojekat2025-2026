package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"content-service/config"
	"content-service/db"
	"content-service/handlers"
	"content-service/middleware"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"

	"shared-utils/logging"
	"shared-utils/validation"
)

var logger *logging.Logger

func main() {
	config.LoadConfig()

	var err error
	isDev := os.Getenv("ENV") == "development"
	logger, err = logging.NewLogger(logging.LogConfig{
		ServiceName:   "content-service",
		LogDir:        "./logs",
		MaxSize:       50,
		MaxBackups:    30,
		MaxAge:        90,
		Compress:      true,
		ConsoleOutput: isDev,
	})
	if err != nil {
		log.Fatal("Failed to initialize logger:", err)
	}
	logger.Application.Info().Msg("Content service starting...")

	handlers.SetLogger(logger)
	middleware.SetLogger(logger)

	db.ConnectMongo()

	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		if err := validation.RegisterCustomValidators(v); err != nil {
			log.Fatalf("Failed to register custom validators: %v", err)
		}
		fmt.Println("Custom validators registered successfully")
	}

	r := gin.Default()

	r.Use(logging.RequestIDMiddleware())

	apiLimiter := middleware.NewRateLimiter(config.RateLimitAPIReqs, config.RateLimitAPIWindow)
	r.Use(apiLimiter.RateLimitByUser())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "content-service up",
		})
	})

	api := r.Group("/api/content")
	{
		artists := api.Group("/artists")
		{
			artists.GET("", handlers.GetArtists)
			artists.GET("/genres", handlers.GetGenres)
			artists.GET("/:id", handlers.GetArtistByID)
			artists.GET("/:id/albums", handlers.GetAlbumsByArtist)
			artists.POST("/:id/albums", middleware.AuthMiddleware(), middleware.RequireRole("ADMIN"), handlers.CreateAlbumForArtist)
			artists.POST("", middleware.AuthMiddleware(), middleware.RequireRole("ADMIN"), handlers.CreateArtist)
			artists.PUT("/:id", middleware.AuthMiddleware(), middleware.RequireRole("ADMIN"), handlers.UpdateArtist)
			artists.DELETE("/:id", middleware.AuthMiddleware(), middleware.RequireRole("ADMIN"), handlers.DeleteArtist)
		}

		albums := api.Group("/albums")
		{
			albums.GET("/:id", handlers.GetAlbumByID)
			albums.GET("/:id/songs", middleware.AuthMiddleware(), handlers.GetSongsByAlbum)
			albums.POST("/:id/songs", middleware.AuthMiddleware(), middleware.RequireRole("ADMIN"), handlers.CreateSongForAlbum)
			albums.POST("", middleware.AuthMiddleware(), middleware.RequireRole("ADMIN"), handlers.CreateAlbum)
			albums.PUT("/:id", middleware.AuthMiddleware(), middleware.RequireRole("ADMIN"), handlers.UpdateAlbum)
			albums.DELETE("/:id", middleware.AuthMiddleware(), middleware.RequireRole("ADMIN"), handlers.DeleteAlbum)
		}

		songs := api.Group("/songs")
		{
			songs.GET("", handlers.GetSongs)
			songs.GET("/:id", handlers.GetSongByID)
			songs.GET("/:id/audio", middleware.AuthMiddleware(), handlers.StreamSongAudio)

			songs.POST(
				"",
				middleware.AuthMiddleware(),
				middleware.RequireRole("ADMIN"),
				handlers.CreateSong,
			)

			songs.POST(
				"/:id/audio",
				middleware.AuthMiddleware(),
				middleware.RequireRole("ADMIN"),
				handlers.UploadSongAudio,
			)

			songs.PUT(
				"/:id",
				middleware.AuthMiddleware(),
				middleware.RequireRole("ADMIN"),
				handlers.UpdateSong,
			)

			songs.DELETE(
				"/:id",
				middleware.AuthMiddleware(),
				middleware.RequireRole("ADMIN"),
				handlers.DeleteSong,
			)

			songs.GET("/:id/rating", middleware.AuthMiddleware(), handlers.GetUserRating)
			songs.POST("/:id/rating", middleware.AuthMiddleware(), handlers.SetRating)
			songs.DELETE("/:id/rating", middleware.AuthMiddleware(), handlers.DeleteRating)
			songs.GET("/:id/rating/average", handlers.GetAverageRating) // Public endpoint
		}

		subscriptions := api.Group("/subscriptions", middleware.AuthMiddleware())
		{
			subscriptions.GET("/artists", handlers.GetUserArtistSubscriptions)
			subscriptions.GET("/genres", handlers.GetUserGenreSubscriptions)
		}

		artists.POST("/:id/subscribe", middleware.AuthMiddleware(), handlers.SubscribeToArtist)
		artists.DELETE("/:id/subscribe", middleware.AuthMiddleware(), handlers.UnsubscribeFromArtist)
		artists.GET("/:id/subscription", middleware.AuthMiddleware(), handlers.GetArtistSubscriptionStatus)

		genres := api.Group("/genres")
		{
			genres.POST("/:genre/subscribe", middleware.AuthMiddleware(), handlers.SubscribeToGenre)
			genres.DELETE("/:genre/subscribe", middleware.AuthMiddleware(), handlers.UnsubscribeFromGenre)
			genres.GET("/:genre/subscription", middleware.AuthMiddleware(), handlers.GetGenreSubscriptionStatus)
		}
	}

	internal := r.Group("/api/internal")
	internal.Use(middleware.ServiceAuthMiddleware())
	{
		internal.POST("/subscription-events", handlers.HandleSubscriptionAsyncEvent)
	}

	fmt.Printf("Content service running on port %s\n", config.Port)
	srv := &http.Server{
		Addr:              ":" + config.Port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	if os.Getenv("TLS_ENABLED") == "true" {
		certFile := os.Getenv("TLS_CERT_FILE")
		keyFile := os.Getenv("TLS_KEY_FILE")
		if certFile == "" || keyFile == "" {
			log.Fatal("TLS is enabled but TLS_CERT_FILE or TLS_KEY_FILE is missing")
		}
		log.Printf("TLS enabled (content-service): %s\n", certFile)
		log.Fatal(srv.ListenAndServeTLS(certFile, keyFile))
	} else {
		log.Fatal(srv.ListenAndServe())
	}
}
