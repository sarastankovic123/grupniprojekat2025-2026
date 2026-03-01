package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"users-service/config"
	"users-service/repository"
	"users-service/utils"
)

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	OldPassword     string `json:"oldPassword"`
	Password        string `json:"password"`
	NewPassword     string `json:"newPassword"`
}

func ChangePassword(c *gin.Context) {
	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	userID, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userIDStr, ok := userID.(string)
	if !ok || strings.TrimSpace(userIDStr) == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	oid, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := repository.FindUserByID(oid)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if config.PasswordMinAge > 0 && time.Since(user.PasswordChangedAt) < config.PasswordMinAge {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password is too new to be changed yet"})
		return
	}

	current := firstNonEmpty(req.CurrentPassword, req.OldPassword, req.Password)
	if strings.TrimSpace(current) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Current password required"})
		return
	}

	newPassword := strings.TrimSpace(req.NewPassword)
	if newPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "New password required"})
		return
	}

	if !utils.CheckPassword(current, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid current password"})
		return
	}

	if !utils.IsStrongPassword(newPassword) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must contain uppercase, lowercase, number, and special character"})
		return
	}

	hash, err := utils.HashPassword(newPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Password hashing failed"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = repository.UpdateUserPasswordAndUnlock(ctx, user.ID, hash, time.Now())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

