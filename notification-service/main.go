package main

import (
	"fmt"

	"notification-service/config"
	"notification-service/db"
	"notification-service/handlers"
	"notification-service/middleware"

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
			"status": "notification-service up",
		})
	})

	api := r.Group("/api/notifications")
	{
		// Authenticated endpoints (require JWT)
		api.GET("", middleware.AuthMiddleware(), handlers.GetNotifications)
		api.PUT("/:id/read", middleware.AuthMiddleware(), handlers.MarkAsRead)
		api.PUT("/:id/unread", middleware.AuthMiddleware(), handlers.MarkAsUnread)

		// Internal endpoint (requires service API key)
		api.POST("", middleware.ServiceAuthMiddleware(), handlers.CreateNotification)
	}

	fmt.Printf("Notification service running on port %s\n", config.Port)
	r.Run(":" + config.Port)
}
