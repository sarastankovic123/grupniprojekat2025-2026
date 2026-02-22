package config

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

var (
	JWTSecret          []byte
	ServiceAPIKey      string
	RateLimitAPIReqs   int
	RateLimitAPIWindow time.Duration
	CassandraHosts     []string
	CassandraPort      int
	CassandraKeyspace  string
	CassandraUsername  string
	CassandraPassword  string
	Port               string
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

	// Service Authentication
	ServiceAPIKey = getEnv("SERVICE_API_KEY", "")
	if ServiceAPIKey == "" {
		log.Fatal("SERVICE_API_KEY environment variable is required")
	}

	// Rate Limiting
	RateLimitAPIReqs = getEnvAsInt("RATE_LIMIT_API_REQUESTS", 100)
	apiWindowStr := getEnv("RATE_LIMIT_API_WINDOW", "1m")
	var err error
	RateLimitAPIWindow, err = time.ParseDuration(apiWindowStr)
	if err != nil {
		log.Fatal("Invalid RATE_LIMIT_API_WINDOW format:", err)
	}

	// Cassandra (notifications DB)
	hosts := strings.TrimSpace(getEnv("CASSANDRA_HOSTS", "localhost"))
	if hosts == "" {
		hosts = "localhost"
	}
	CassandraHosts = splitAndTrim(hosts, ",")
	CassandraPort = getEnvAsInt("CASSANDRA_PORT", 9042)
	CassandraKeyspace = strings.TrimSpace(getEnv("CASSANDRA_KEYSPACE", "notifications"))
	if CassandraKeyspace == "" {
		CassandraKeyspace = "notifications"
	}
	CassandraUsername = strings.TrimSpace(getEnv("CASSANDRA_USERNAME", ""))
	CassandraPassword = strings.TrimSpace(getEnv("CASSANDRA_PASSWORD", ""))

	// Server
	Port = getEnv("PORT", "8003")

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

func splitAndTrim(s string, sep string) []string {
	parts := strings.Split(s, sep)
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}
