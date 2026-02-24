package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"notification-service/config"
	"notification-service/db"
	"notification-service/handlers"
	"notification-service/middleware"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"

	"shared-utils/logging"
	"shared-utils/validation"
)

var logger *logging.Logger

func main() {
	// Load configuration
	config.LoadConfig()

	// Initialize logger FIRST
	var err error
	isDev := os.Getenv("ENV") == "development"
	logger, err = logging.NewLogger(logging.LogConfig{
		ServiceName:   "notification-service",
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
	logger.Application.Info().Msg("Notification service starting...")

	// Set logger for handlers package
	handlers.SetLogger(logger)

	db.ConnectCassandra()
	defer db.Close()

	// Register custom validators
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		if err := validation.RegisterCustomValidators(v); err != nil {
			log.Fatalf("Failed to register custom validators: %v", err)
		}
		fmt.Println("Custom validators registered successfully")
	}

	r := gin.Default()

	// Add request ID middleware FIRST
	r.Use(logging.RequestIDMiddleware())

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
	srv := &http.Server{
		Addr:              ":" + config.Port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	if os.Getenv("TLS_ENABLED") == "true" {
		certFile := os.Getenv("TLS_CERT_FILE")
		keyFile := os.Getenv("TLS_KEY_FILE")
		if certFile == "" || keyFile == "" {
			log.Fatal("TLS is enabled but TLS_CERT_FILE or TLS_KEY_FILE is missing")
		}
		log.Printf("TLS enabled (notification-service): %s\n", certFile)
		log.Fatal(srv.ListenAndServeTLS(certFile, keyFile))
	} else {
		log.Fatal(srv.ListenAndServe())
	}
}
