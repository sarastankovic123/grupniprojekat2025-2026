package middleware

import (
	"net/http"
	"recommendation-service/config"

	"github.com/gin-gonic/gin"
)

// ServiceAuthMiddleware validates service-to-service API key.
func ServiceAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("X-Service-API-Key")
		if apiKey == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Service API key required"})
			c.Abort()
			return
		}
		if apiKey != config.ServiceAPIKey {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid service API key"})
			c.Abort()
			return
		}
		c.Next()
	}
}
