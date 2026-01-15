package handlers

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"

	"users-service/repository"
	"users-service/utils"
)

type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required,min=16"`
	NewPassword string `json:"newPassword" binding:"required,min=8,max=128"`
}

func ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	req.Token = strings.TrimSpace(req.Token)
	if req.Token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token missing"})
		return
	}

	if !utils.IsStrongPassword(req.NewPassword) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must contain uppercase, lowercase, number, and special character"})
		return
	}

	hash := sha256.Sum256([]byte(req.Token))
	tokenHash := hex.EncodeToString(hash[:])

	resetToken, err := repository.FindPasswordResetTokenByHash(tokenHash)
	if err != nil || resetToken == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired reset link"})
		return
	}

	if resetToken.UsedAt != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reset link already used"})
		return
	}

	if time.Now().After(resetToken.ExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reset link expired"})
		return
	}

	// Mark token used (best effort).
	_ = repository.MarkPasswordResetTokenUsed(tokenHash)

	passwordHash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Password hashing failed"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	now := time.Now()
	_, err = repository.UpdateUserPasswordAndUnlock(ctx, resetToken.UserID, passwordHash, now)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reset link"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
}
