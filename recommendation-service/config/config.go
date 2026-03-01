package config

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

var (
	JWTSecret          []byte
	ServiceAPIKey      string
	RateLimitAPIReqs   int
	RateLimitAPIWindow time.Duration
	MongoURI           string
	ContentDBName      string
	Port               string
	Neo4jURI           string
	Neo4jUser          string
	Neo4jPassword      string
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

	Neo4jURI = getEnv("NEO4J_URI", "bolt://localhost:7687")
	Neo4jUser = getEnv("NEO4J_USER", "neo4j")
	Neo4jPassword = getEnv("NEO4J_PASSWORD", "")
	if Neo4jPassword == "" {
		log.Fatal("NEO4J_PASSWORD environment variable is required")
	}

	Port = getEnv("PORT", "8004")

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
