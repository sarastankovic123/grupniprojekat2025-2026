package config

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

var (
	JWTSecret                []byte
	ServiceAPIKey            string
	RateLimitAPIReqs         int
	RateLimitAPIWindow       time.Duration
	MongoURI                 string
	Port                     string
	ContentDBName            string
	ContentServiceURL        string
	NotificationsServiceURL  string
	UsersServiceURL          string
	RecommendationServiceURL string
)

func LoadConfig() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	JWTSecret = []byte(getEnv("JWT_SECRET", ""))
	if len(JWTSecret) == 0 {
		log.Fatal("JWT_SECRET environment variable is required")
	}
	if len(JWTSecret) < 32 {
		log.Fatal("JWT_SECRET must be at least 32 characters long")
	}

	ServiceAPIKey = getEnv("SERVICE_API_KEY", "")
	if ServiceAPIKey == "" {
		log.Fatal("SERVICE_API_KEY environment variable is required")
	}

	RateLimitAPIReqs = getEnvAsInt("RATE_LIMIT_API_REQUESTS", 100)
	apiWindowStr := getEnv("RATE_LIMIT_API_WINDOW", "1m")
	var err error
	RateLimitAPIWindow, err = time.ParseDuration(apiWindowStr)
	if err != nil {
		log.Fatal("Invalid RATE_LIMIT_API_WINDOW format:", err)
	}

	MongoURI = getEnv("MONGO_URI", "mongodb://localhost:27017")
	ContentDBName = getEnv("CONTENT_DB_NAME", "content_db")

	Port = getEnv("PORT", "8002")
	ContentServiceURL = getEnv("CONTENT_SERVICE_URL", "https://content-service:8002")

	NotificationsServiceURL = getEnv("NOTIFICATIONS_SERVICE_URL", "https://localhost:8003")
	UsersServiceURL = getEnv("USERS_SERVICE_URL", "https://users-service:8001")
	RecommendationServiceURL = getEnv("RECOMMENDATION_SERVICE_URL", "https://recommendation-service:8004")

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
