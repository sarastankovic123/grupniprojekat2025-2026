package handlers

import (
	"net/http"
	"users-service/repository"

	"github.com/gin-gonic/gin"
)

func Logout(c *gin.Context) {
	refreshTokenString, err := c.Cookie("refresh_token")
	if err != nil {
		var req struct {
			RefreshToken string `json:"refresh_token"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Refresh token required"})
			return
		}
		refreshTokenString = req.RefreshToken
	}

	if err := repository.RevokeRefreshToken(refreshTokenString); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to revoke token, but cookies will be cleared"})
	}

	c.SetCookie("access_token", "", -1, "/", "", false, true)
	c.SetCookie("refresh_token", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}
