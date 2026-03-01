package logging

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	RequestIDKey = "request_id"
)

func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")

		if requestID == "" {
			requestID = uuid.New().String()
		}

		c.Set(RequestIDKey, requestID)

		c.Header("X-Request-ID", requestID)

		c.Next()
	}
}

func GetRequestID(c *gin.Context) string {
	if requestID, exists := c.Get(RequestIDKey); exists {
		if id, ok := requestID.(string); ok {
			return id
		}
	}
	return ""
}

func GetClientIP(c *gin.Context) string {
	forwarded := c.GetHeader("X-Forwarded-For")
	if forwarded != "" {
		if idx := len(forwarded); idx > 0 {
			return forwarded
		}
	}

	return c.ClientIP()
}

func GetUserIDFromContext(c *gin.Context) string {
	if userID, exists := c.Get("user_id"); exists {
		if id, ok := userID.(string); ok {
			return id
		}
	}
	return ""
}

func GetEmailFromContext(c *gin.Context) string {
	if email, exists := c.Get("email"); exists {
		if e, ok := email.(string); ok {
			return e
		}
	}
	return ""
}

func GetRoleFromContext(c *gin.Context) string {
	if role, exists := c.Get("role"); exists {
		if r, ok := role.(string); ok {
			return r
		}
	}
	return ""
}
