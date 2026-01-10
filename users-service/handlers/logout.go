package handlers

import (
	"net/http"
	"users-service/repository"

	"github.com/gin-gonic/gin"
)

func Logout(c *gin.Context) {
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

	// Revoke the refresh token
	if err := repository.RevokeRefreshToken(refreshTokenString); err != nil {
		// Even if revocation fails, clear cookies
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to revoke token, but cookies will be cleared"})
	}

	// Clear cookies
	c.SetCookie("access_token", "", -1, "/", "", false, true)
	c.SetCookie("refresh_token", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}
