package logging

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	// RequestIDKey is the key used to store request ID in Gin context
	RequestIDKey = "request_id"
)

// RequestIDMiddleware generates a unique request ID for each request
// and stores it in the Gin context for use in logging
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if request ID already exists in header (for tracing across services)
		requestID := c.GetHeader("X-Request-ID")

		if requestID == "" {
			// Generate new UUID for this request
			requestID = uuid.New().String()
		}

		// Store in context for handlers to access
		c.Set(RequestIDKey, requestID)

		// Add to response header for client tracing
		c.Header("X-Request-ID", requestID)

		c.Next()
	}
}

// GetRequestID extracts the request ID from Gin context
// Returns empty string if not found
func GetRequestID(c *gin.Context) string {
	if requestID, exists := c.Get(RequestIDKey); exists {
		if id, ok := requestID.(string); ok {
			return id
		}
	}
	return ""
}

// GetClientIP extracts the client IP address from the request
// Checks X-Forwarded-For header first (for proxied requests), then falls back to RemoteIP
func GetClientIP(c *gin.Context) string {
	// Check X-Forwarded-For header (if behind proxy/load balancer)
	forwarded := c.GetHeader("X-Forwarded-For")
	if forwarded != "" {
		// X-Forwarded-For can contain multiple IPs, take the first one
		// Format: "client, proxy1, proxy2"
		if idx := len(forwarded); idx > 0 {
			return forwarded
		}
	}

	// Fall back to RemoteIP (direct connection)
	return c.ClientIP()
}

// GetUserIDFromContext extracts user ID from JWT claims stored in Gin context
// Returns empty string if not authenticated or ID not found
func GetUserIDFromContext(c *gin.Context) string {
	// Check if user_id was set by auth middleware
	if userID, exists := c.Get("user_id"); exists {
		if id, ok := userID.(string); ok {
			return id
		}
	}
	return ""
}

// GetEmailFromContext extracts email from JWT claims stored in Gin context
// Returns empty string if not authenticated or email not found
func GetEmailFromContext(c *gin.Context) string {
	// Check if email was set by auth middleware
	if email, exists := c.Get("email"); exists {
		if e, ok := email.(string); ok {
			return e
		}
	}
	return ""
}

// GetRoleFromContext extracts user role from JWT claims stored in Gin context
// Returns empty string if not authenticated or role not found
func GetRoleFromContext(c *gin.Context) string {
	// Check if role was set by auth middleware
	if role, exists := c.Get("role"); exists {
		if r, ok := role.(string); ok {
			return r
		}
	}
	return ""
}
