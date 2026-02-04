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
	PasswordMinAge      time.Duration
	PasswordMaxAge      time.Duration
	PasswordExpiryLock  time.Duration
	PasswordResetExpiry time.Duration
	ServiceAPIKey       string
	RateLimitAuthReqs   int
	RateLimitAuthWindow time.Duration
	RateLimitAPIReqs    int
	RateLimitAPIWindow  time.Duration
	MongoURI            string
	Port                string

	// Email Configuration
	EmailProvider     string
	EmailFrom         string
	EmailFromName     string
	EmailDevMode      bool
	EmailDevRecipient string

	// SMTP Configuration
	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
	SMTPUseTLS   bool

	// Email Settings
	EmailTemplatesDir  string
	EmailRetryAttempts int
	EmailTimeout       time.Duration
	FrontendURL        string
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

	RefreshSecret = []byte(getEnv("REFRESH_SECRET", ""))
	if len(RefreshSecret) == 0 {
		log.Fatal("REFRESH_SECRET environment variable is required")
	}
	if len(RefreshSecret) < 32 {
		log.Fatal("REFRESH_SECRET must be at least 32 characters long")
	}

	var err error
	JWTAccessExpiry, err = time.ParseDuration(getEnv("JWT_ACCESS_EXPIRY", "1h"))
	if err != nil {
		log.Fatal("Invalid JWT_ACCESS_EXPIRY format:", err)
	}

	JWTRefreshExpiry, err = time.ParseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h"))
	if err != nil {
		log.Fatal("Invalid JWT_REFRESH_EXPIRY format:", err)
	}

	PasswordMinAge, err = time.ParseDuration(getEnv("PASSWORD_MIN_AGE", "24h"))
	if err != nil {
		log.Fatal("Invalid PASSWORD_MIN_AGE format:", err)
	}

	PasswordMaxAge, err = time.ParseDuration(getEnv("PASSWORD_MAX_AGE", "1440h")) // 60 days
	if err != nil {
		log.Fatal("Invalid PASSWORD_MAX_AGE format:", err)
	}

	PasswordExpiryLock, err = time.ParseDuration(getEnv("PASSWORD_EXPIRY_LOCKOUT", "10m"))
	if err != nil {
		log.Fatal("Invalid PASSWORD_EXPIRY_LOCKOUT format:", err)
	}

	PasswordResetExpiry, err = time.ParseDuration(getEnv("PASSWORD_RESET_TOKEN_EXPIRY", "15m"))
	if err != nil {
		log.Fatal("Invalid PASSWORD_RESET_TOKEN_EXPIRY format:", err)
	}

	ServiceAPIKey = getEnv("SERVICE_API_KEY", "")
	if ServiceAPIKey == "" {
		log.Fatal("SERVICE_API_KEY environment variable is required")
	}

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

	MongoURI = getEnv("MONGO_URI", "mongodb://localhost:27017")

	Port = getEnv("PORT", "8001")

	// Load Email Configuration
	EmailProvider = getEnv("EMAIL_PROVIDER", "smtp")
	EmailFrom = getEnv("EMAIL_FROM", "")
	EmailFromName = getEnv("EMAIL_FROM_NAME", "Music Platform")
	EmailDevMode = getEnv("EMAIL_DEV_MODE", "false") == "true"
	EmailDevRecipient = getEnv("EMAIL_DEV_RECIPIENT", "")

	// Load SMTP Configuration
	SMTPHost = getEnv("SMTP_HOST", "smtp.gmail.com")
	SMTPPort = getEnvAsInt("SMTP_PORT", 587)
	SMTPUsername = getEnv("SMTP_USERNAME", "")
	SMTPPassword = getEnv("SMTP_PASSWORD", "")
	SMTPUseTLS = getEnv("SMTP_USE_TLS", "true") == "true"

	// Load Email Settings
	EmailTemplatesDir = getEnv("EMAIL_TEMPLATES_DIR", "./templates/emails")
	EmailRetryAttempts = getEnvAsInt("EMAIL_RETRY_ATTEMPTS", 3)
	timeoutStr := getEnv("EMAIL_TIMEOUT", "30s")
	EmailTimeout, err = time.ParseDuration(timeoutStr)
	if err != nil {
		log.Fatal("Invalid EMAIL_TIMEOUT format:", err)
	}
	FrontendURL = getEnv("FRONTEND_URL", "http://localhost:5173")

	// Validate email configuration
	if EmailProvider == "smtp" && !EmailDevMode {
		if SMTPPassword == "" {
			log.Fatal("SMTP_PASSWORD is required when EMAIL_PROVIDER=smtp and EMAIL_DEV_MODE=false")
		}
		if EmailFrom == "" {
			log.Fatal("EMAIL_FROM is required when EMAIL_PROVIDER=smtp")
		}
	}

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
