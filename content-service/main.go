package main

import (
	"fmt"

	"content-service/config"
	"content-service/db"
	"content-service/handlers"
	"content-service/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	config.LoadConfig()

	db.ConnectMongo()

	r := gin.Default()

	// Global rate limiting (100 requests per minute)
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
			artists.GET("/:id", handlers.GetArtistByID)
			artists.GET("/:id/albums", handlers.GetAlbumsByArtist)
			artists.POST("", middleware.AuthMiddleware(), middleware.RequireRole("ADMIN"), handlers.CreateArtist)
		}

		albums := api.Group("/albums")
		{

			albums.GET("/:id", handlers.GetAlbumByID)

			albums.GET("/:id/songs", middleware.AuthMiddleware(), handlers.GetSongsByAlbum)
			albums.POST("", middleware.AuthMiddleware(), middleware.RequireRole("ADMIN"), handlers.CreateAlbum)
		}

		songs := api.Group("/songs")
		{
			songs.GET("", handlers.GetSongs)
			songs.GET("/:id", handlers.GetSongByID)

			songs.POST(
				"",
				middleware.AuthMiddleware(),
				middleware.RequireRole("ADMIN"),
				handlers.CreateSong,
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
		}
	}

	fmt.Printf("Content service running on port %s\n", config.Port)
	r.Run(":" + config.Port)
}
