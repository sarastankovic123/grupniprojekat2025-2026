package main

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"users-service/config"
	"users-service/db"
	"users-service/handlers"
	"users-service/middleware"
)

func main() {
	// Load configuration
	config.LoadConfig()

	db.ConnectMongo()

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "users-service up",
		})
	})

	// Strict rate limiting for auth endpoints (5 requests per 15 minutes)
	authLimiter := middleware.NewRateLimiter(config.RateLimitAuthReqs, config.RateLimitAuthWindow)

	// Global API rate limiting (100 requests per minute)
	apiLimiter := middleware.NewRateLimiter(config.RateLimitAPIReqs, config.RateLimitAPIWindow)
	r.Use(apiLimiter.RateLimitByIP())

	// Auth routes
	r.POST("/api/auth/register", authLimiter.RateLimitByIP(), handlers.Register)
	r.GET("/api/auth/confirm", handlers.ConfirmEmail)
	r.POST("/api/auth/login", authLimiter.RateLimitByIP(), handlers.Login)
	r.POST("/api/auth/verify-otp", authLimiter.RateLimitByIP(), handlers.VerifyOTP)
	r.POST("/api/auth/refresh", handlers.RefreshToken)
	r.POST("/api/auth/logout", handlers.Logout)
	r.POST("/api/auth/magic-link/request", handlers.RequestMagicLink)
	r.GET("/api/auth/magic-link/consume", handlers.ConsumeMagicLink)

	fmt.Printf("Users service running on port %s\n", config.Port)
	r.Run(":" + config.Port)
}
