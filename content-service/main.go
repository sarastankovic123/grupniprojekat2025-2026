package main

import (
	"fmt"

	"content-service/db"
	"content-service/handlers"
	"content-service/middleware"

	"github.com/gin-gonic/gin"
)

func main() {

	db.ConnectMongo()

	r := gin.Default()

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
			artists.POST("", handlers.CreateArtist)

		}

		albums := api.Group("/albums")
		{
			albums.GET("/:id/songs", middleware.AuthMiddleware(), handlers.GetSongsByAlbum)
		}

		songs := api.Group("/songs")
		{
			songs.GET("", middleware.AuthMiddleware(), handlers.GetAllSongs)
			songs.GET("/:id", middleware.AuthMiddleware(), handlers.GetSongByID)

			songs.POST("", middleware.AuthMiddleware(), middleware.RequireRole("ADMIN"), handlers.CreateSong)
			songs.PUT("/:id", middleware.AuthMiddleware(), middleware.RequireRole("ADMIN"), handlers.UpdateSong)
			songs.DELETE("/:id", middleware.AuthMiddleware(), middleware.RequireRole("ADMIN"), handlers.DeleteSong)
		}
	}

	fmt.Println("Content service running on port 8002")
	r.Run(":8002")
}
