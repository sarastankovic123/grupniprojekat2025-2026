package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"shared-utils/httpclient"
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

	if err := utils.SendEmailConfirmationEmail(user.Email, confirmURL); err != nil {
		Logger.Application.Error().
			Err(err).
			Str("email", user.Email).
			Msg("Failed to send confirmation email")
	}

	go func() {
		if NotificationsClient == nil {
			return
		}

		payload := map[string]string{
			"userId":  user.ID.Hex(),
			"message": "Confirm your account: " + confirmURL,
		}

		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		req, err := httpclient.NewJSONRequest(ctx, "POST", config.NotificationsServiceURL+"/api/notifications", payload)
		if err != nil {
			return
		}
		req.Header.Set("X-Service-API-Key", config.ServiceAPIKey)

		resp, err := NotificationsClient.Do(ctx, req)
		if resp != nil && resp.Body != nil {
			_ = resp.Body.Close()
		}
		if err != nil {
			Logger.Application.Warn().Err(err).Msg("Failed to send notification (resend confirmation)")
		}
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Confirmation email resent"})
}
