package handlers

import (
	"net/http"
	"time"
	"users-service/config"
	"users-service/models"
	"users-service/repository"
	"users-service/utils"

	"github.com/gin-gonic/gin"
)

func RefreshToken(c *gin.Context) {
	// Try to get refresh token from cookie
	refreshTokenString, err := c.Cookie("refresh_token")
	if err != nil {
		// Fall back to request body for backward compatibility
		var req struct {
			RefreshToken string `json:"refresh_token"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Refresh token required"})
			return
		}
		refreshTokenString = req.RefreshToken
	}

	// Find refresh token in database
	storedToken, err := repository.FindRefreshTokenByToken(refreshTokenString)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	// Check if token is revoked
	if storedToken.IsRevoked {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token has been revoked"})
		return
	}

	// Check if token is expired
	if time.Now().After(storedToken.ExpiresAt) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token has expired"})
		return
	}

	// Get user from database
	user, err := repository.FindUserByID(storedToken.UserID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Generate new access token
	accessToken, err := utils.GenerateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
		return
	}

	// Optional: Rotate refresh token for better security
	newRefreshTokenString, err := utils.GenerateRefreshToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	// Revoke old refresh token
	if err := repository.RevokeRefreshToken(refreshTokenString); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to revoke old token"})
		return
	}

	// Store new refresh token
	newRefreshToken := &models.RefreshToken{
		UserID:    user.ID,
		Token:     newRefreshTokenString,
		ExpiresAt: time.Now().Add(config.JWTRefreshExpiry),
	}
	if err := repository.CreateRefreshToken(newRefreshToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store refresh token"})
		return
	}

	// Set cookies
	c.SetCookie(
		"access_token",
		accessToken,
		int(config.JWTAccessExpiry.Seconds()),
		"/",
		"",
		false, // Set to true in production with HTTPS
		true,
	)
	c.SetSameSite(http.SameSiteStrictMode)

	c.SetCookie(
		"refresh_token",
		newRefreshTokenString,
		int(config.JWTRefreshExpiry.Seconds()),
		"/",
		"",
		false, // Set to true in production with HTTPS
		true,
	)

	c.JSON(http.StatusOK, gin.H{
		"message":       "Token refreshed successfully",
		"access_token":  accessToken,
		"refresh_token": newRefreshTokenString,
	})
}
