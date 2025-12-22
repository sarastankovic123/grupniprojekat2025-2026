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
		c.JSON(200, gin.H{"status": "content-service up"})
	})

	r.GET("/api/content/artists", handlers.GetArtists)

	fmt.Println("Content service running on port 8002")
	r.Run(":8002")
}
