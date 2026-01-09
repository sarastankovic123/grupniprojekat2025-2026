package main

import (
	"fmt"

	"notification-service/db"
	"notification-service/handlers"
	"notification-service/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	db.ConnectMongo()

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "notification-service up",
		})
	})

	api := r.Group("/api/notifications")
	{
		// Authenticated endpoints (require JWT)
		api.GET("", middleware.AuthMiddleware(), handlers.GetNotifications)
		api.PUT("/:id/read", middleware.AuthMiddleware(), handlers.MarkAsRead)
		api.PUT("/:id/unread", middleware.AuthMiddleware(), handlers.MarkAsUnread)

		// Internal endpoint (could add admin/service auth later)
		api.POST("", handlers.CreateNotification)
	}

	fmt.Println("Notification service running on port 8003")
	r.Run(":8003")
}
