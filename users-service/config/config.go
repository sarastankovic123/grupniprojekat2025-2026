package config

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

var (
	JWTSecret           []byte
	RefreshSecret       []byte
	JWTAccessExpiry     time.Duration
	JWTRefreshExpiry    time.Duration
	ServiceAPIKey       string
	RateLimitAuthReqs   int
	RateLimitAuthWindow time.Duration
	RateLimitAPIReqs    int
	RateLimitAPIWindow  time.Duration
	MongoURI            string
	Port                string
)

func LoadConfig() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// JWT Configuration
	JWTSecret = []byte(getEnv("JWT_SECRET", ""))
	if len(JWTSecret) == 0 {
		log.Fatal("JWT_SECRET environment variable is required")
	}
	if len(JWTSecret) < 32 {
		log.Fatal("JWT_SECRET must be at least 32 characters long")
	}

	RefreshSecret = []byte(getEnv("REFRESH_SECRET", ""))
	if len(RefreshSecret) == 0 {
		log.Fatal("REFRESH_SECRET environment variable is required")
	}
	if len(RefreshSecret) < 32 {
		log.Fatal("REFRESH_SECRET must be at least 32 characters long")
	}

	// JWT Expiry
	var err error
	JWTAccessExpiry, err = time.ParseDuration(getEnv("JWT_ACCESS_EXPIRY", "1h"))
	if err != nil {
		log.Fatal("Invalid JWT_ACCESS_EXPIRY format:", err)
	}

	JWTRefreshExpiry, err = time.ParseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h"))
	if err != nil {
		log.Fatal("Invalid JWT_REFRESH_EXPIRY format:", err)
	}

	// Service Authentication
	ServiceAPIKey = getEnv("SERVICE_API_KEY", "")
	if ServiceAPIKey == "" {
		log.Fatal("SERVICE_API_KEY environment variable is required")
	}

	// Rate Limiting
	RateLimitAuthReqs = getEnvAsInt("RATE_LIMIT_AUTH_REQUESTS", 5)
	authWindowStr := getEnv("RATE_LIMIT_AUTH_WINDOW", "15m")
	RateLimitAuthWindow, err = time.ParseDuration(authWindowStr)
	if err != nil {
		log.Fatal("Invalid RATE_LIMIT_AUTH_WINDOW format:", err)
	}

	RateLimitAPIReqs = getEnvAsInt("RATE_LIMIT_API_REQUESTS", 100)
	apiWindowStr := getEnv("RATE_LIMIT_API_WINDOW", "1m")
	RateLimitAPIWindow, err = time.ParseDuration(apiWindowStr)
	if err != nil {
		log.Fatal("Invalid RATE_LIMIT_API_WINDOW format:", err)
	}

	// MongoDB
	MongoURI = getEnv("MONGO_URI", "mongodb://localhost:27017")

	// Server
	Port = getEnv("PORT", "8001")

	log.Println("Configuration loaded successfully")
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}
	var value int
	if _, err := fmt.Sscanf(valueStr, "%d", &value); err != nil {
		log.Printf("Warning: Invalid integer value for %s, using default %d", key, defaultValue)
		return defaultValue
	}
	return value
}
