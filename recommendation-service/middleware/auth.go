package middleware

import (
	"fmt"
	"net/http"
	"recommendation-service/config"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"shared-utils/auth"
	"shared-utils/logging"
)

type JWTClaims struct {
	UserID   string `json:"user_id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

func ValidateJWT(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return config.JWTSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenString string

		// Try to get token from cookie first
		token, err := c.Cookie("access_token")
		if err == nil && token != "" {
			tokenString = token
		} else {
			// Fall back to Authorization header
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" {
				ctx := logging.NewSecurityEventContext(c)
				Logger.LogAuthTokenEvent(ctx, "auth_token_missing", "no token provided in cookie or header")
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required (cookie or header)"})
				c.Abort()
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				ctx := logging.NewSecurityEventContext(c)
				Logger.LogAuthTokenEvent(ctx, "auth_token_invalid", "invalid authorization header format")
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
				c.Abort()
				return
			}
			tokenString = parts[1]
		}

		claims, err := ValidateJWT(tokenString)
		if err != nil {
			ctx := logging.NewSecurityEventContext(c)
			Logger.LogAuthTokenEvent(ctx, "auth_token_invalid", err.Error())
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("username", claims.Username)
		c.Set("role", auth.NormalizeRole(claims.Role))

		c.Next()
	}
}
