package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"

	"shared-utils/logging"
	"shared-utils/validation"
	"users-service/bootstrap"
	"users-service/config"
	"users-service/db"
	"users-service/email"
	"users-service/handlers"
	"users-service/middleware"
)

var logger *logging.Logger

func main() {

	config.LoadConfig()

	// Initialize logger FIRST
	var err error
	isDev := os.Getenv("ENV") == "development"
	logger, err = logging.NewLogger(logging.LogConfig{
		ServiceName:   "users-service",
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
	logger.Application.Info().Msg("Users service starting...")

	// Initialize email service
	if err := email.InitEmailService(logger); err != nil {
		log.Fatal("Failed to initialize email service:", err)
	}
	logger.Application.Info().Msg("Email service initialized")

	// Set logger for handlers package
	handlers.SetLogger(logger)

	db.ConnectMongo()
	bootstrap.EnsureAdminFromEnv()

	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		if err := validation.RegisterCustomValidators(v); err != nil {
			log.Fatalf("Failed to register custom validators: %v", err)
		}
		fmt.Println("Custom validators registered successfully")
	}

	r := gin.Default()

	// Add request ID middleware FIRST
	r.Use(logging.RequestIDMiddleware())

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
	if os.Getenv("TLS_ENABLED") == "true" {
		certFile := os.Getenv("TLS_CERT_FILE")
		keyFile := os.Getenv("TLS_KEY_FILE")
		if certFile == "" || keyFile == "" {
			log.Fatal("TLS is enabled but TLS_CERT_FILE or TLS_KEY_FILE is missing")
		}
		log.Printf("TLS enabled (users-service): %s\n", certFile)
		r.RunTLS(":"+config.Port, certFile, keyFile)
	} else {
		r.Run(":" + config.Port)
	}
}
