package main

import (
	"fmt"

	"content-service/db"
	"content-service/handlers"

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
		}
	}

	fmt.Println("Content service running on port 8002")
	r.Run(":8002")
}
