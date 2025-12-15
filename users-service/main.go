package main

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"users-service/db"
	"users-service/handlers"
)

func main() {

	db.ConnectMongo()

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "users-service up",
		})
	})

	fmt.Println("Users service running on port 8001")
	r.POST("/api/auth/register", handlers.Register)
	r.GET("/api/auth/confirm", handlers.ConfirmEmail)
	r.Run(":8001")
}
