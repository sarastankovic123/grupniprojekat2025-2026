package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"

	"shared-utils/validation"
	"users-service/bootstrap"
	"users-service/config"
	"users-service/db"
	"users-service/handlers"
	"users-service/middleware"
)

func main() {

	config.LoadConfig()

	db.ConnectMongo()
	bootstrap.EnsureAdminFromEnv()

	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		if err := validation.RegisterCustomValidators(v); err != nil {
			log.Fatalf("Failed to register custom validators: %v", err)
		}
		fmt.Println("Custom validators registered successfully")
	}

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "users-service up",
		})
	})

	authLimiter := middleware.NewRateLimiter(config.RateLimitAuthReqs, config.RateLimitAuthWindow)

	apiLimiter := middleware.NewRateLimiter(config.RateLimitAPIReqs, config.RateLimitAPIWindow)
	r.Use(apiLimiter.RateLimitByIP())

	// Auth routes
	r.POST("/api/auth/register", authLimiter.RateLimitByIP(), handlers.Register)
	r.GET("/api/auth/confirm", handlers.ConfirmEmail)
	r.POST("/api/auth/confirm", handlers.ConfirmEmail)
	r.POST("/api/auth/login", authLimiter.RateLimitByIP(), handlers.Login)
	r.POST("/api/auth/verify-otp", authLimiter.RateLimitByIP(), handlers.VerifyOTP)
	r.POST("/api/auth/refresh", handlers.RefreshToken)
	r.POST("/api/auth/logout", handlers.Logout)
	r.POST("/api/auth/change-password", middleware.AuthMiddleware(), handlers.ChangePassword)
	r.POST("/api/auth/forgot-password", authLimiter.RateLimitByIP(), handlers.ForgotPassword)
	r.POST("/api/auth/reset-password", authLimiter.RateLimitByIP(), handlers.ResetPassword)
	r.POST("/api/auth/magic-link/request", handlers.RequestMagicLink)
	r.POST("/api/auth/magic-link/consume", handlers.ConsumeMagicLink)
	r.POST("/api/auth/resend-confirmation", handlers.ResendConfirmation)
	r.GET("/api/auth/me", middleware.AuthMiddleware(), handlers.GetMe)
	r.PATCH("/api/auth/me", middleware.AuthMiddleware(), handlers.UpdateMe)

	fmt.Printf("Users service running on port %s\n", config.Port)
	r.Run(":" + config.Port)
}
