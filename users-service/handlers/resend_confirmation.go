package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"users-service/config"
	"users-service/models"
	"users-service/repository"
	"users-service/utils"
)

type ResendConfirmationRequest struct {
	Email string `json:"email" binding:"required,email"`
}

func ResendConfirmation(c *gin.Context) {
	var req ResendConfirmationRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email"})
		return
	}

	user, err := repository.FindUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if user.IsConfirmed {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Account already confirmed"})
		return
	}

	tokenValue, err := utils.GenerateToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token generation failed"})
		return
	}

	emailToken := models.EmailConfirmationToken{
		UserID:    user.ID,
		Token:     tokenValue,
		ExpiresAt: time.Now().Add(30 * time.Minute),
		CreatedAt: time.Now(),
	}

	if err := repository.SaveEmailToken(emailToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Saving token failed"})
		return
	}

	frontendURL := strings.TrimRight(config.FrontendURL, "/")
	confirmURL := fmt.Sprintf("%s/confirm?token=%s", frontendURL, tokenValue)

	// Send email confirmation
	if err := utils.SendEmailConfirmationEmail(user.Email, confirmURL); err != nil {
		// Log error but still create notification
		Logger.Application.Error().
			Err(err).
			Str("email", user.Email).
			Msg("Failed to send confirmation email")
	}

	go func() {
		notifBody, _ := json.Marshal(map[string]string{
			"userId":  user.ID.Hex(),
			"message": "Confirm your account: " + confirmURL,
		})

		req, _ := http.NewRequest(
			"POST",
			"https://localhost:8003/api/notifications",
			bytes.NewBuffer(notifBody),
		)

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Service-API-Key", config.ServiceAPIKey)

		http.DefaultClient.Do(req)
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Confirmation email resent"})
}
