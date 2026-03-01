package handlers

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"users-service/config"
	"users-service/models"
	"users-service/repository"
	"users-service/utils"
)

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email,min=5,max=255"`
}

func ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "If the email exists, a reset link has been sent."})
		return
	}

	email := strings.TrimSpace(req.Email)
	if !utils.IsValidEmail(email) {
		c.JSON(http.StatusOK, gin.H{"message": "If the email exists, a reset link has been sent."})
		return
	}

	user, err := repository.FindUserByEmail(email)
	if err == nil && user != nil {
		rawToken := make([]byte, 32)
		_, _ = rand.Read(rawToken)
		token := hex.EncodeToString(rawToken)

		hash := sha256.Sum256([]byte(token))
		tokenHash := hex.EncodeToString(hash[:])

		resetToken := models.PasswordResetToken{
			ID:        primitive.NewObjectID(),
			UserID:    user.ID,
			TokenHash: tokenHash,
			ExpiresAt: time.Now().Add(config.PasswordResetExpiry),
			CreatedAt: time.Now(),
		}

		_ = repository.CreatePasswordResetToken(resetToken)

		frontendURL := strings.TrimRight(os.Getenv("FRONTEND_URL"), "/")
		if frontendURL == "" {
			frontendURL = "http://localhost:5173"
		}

		link := frontendURL + "/reset-password?token=" + token
		_ = utils.SendPasswordResetEmail(user.Email, link)
	}

	c.JSON(http.StatusOK, gin.H{"message": "If the email exists, a reset link has been sent."})
}

