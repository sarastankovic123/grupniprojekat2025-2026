package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"shared-utils/auth"
	"shared-utils/logging"
	"shared-utils/validation"
	"users-service/config"
	"users-service/models"
	"users-service/repository"
	"users-service/utils"
)

func Register(c *gin.Context) {
	var req RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		ctx := logging.NewSecurityEventContext(c)
		Logger.LogValidationFailure(ctx, "registration_request", map[string]string{
			"error": validation.FormatValidationError(err),
		})
		c.JSON(http.StatusBadRequest, gin.H{"error": validation.FormatValidationError(err)})
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(req.Email)
	req.FirstName = strings.TrimSpace(req.FirstName)
	req.LastName = strings.TrimSpace(req.LastName)

	req.FirstName = validation.StripControlCharacters(req.FirstName)
	req.LastName = validation.StripControlCharacters(req.LastName)

	if !utils.IsValidEmail(req.Email) {
		ctx := logging.NewSecurityEventContext(c)
		Logger.LogUserRegistration(ctx, "", req.Email, false, "invalid email format")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})
		return
	}

	if !utils.IsStrongPassword(req.Password) {
		ctx := logging.NewSecurityEventContext(c)
		Logger.LogUserRegistration(ctx, "", req.Email, false, "weak password")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must contain uppercase, lowercase, number, and special character"})
		return
	}

	_, err := repository.FindUserByUsername(req.Username)
	if err == nil {
		ctx := logging.NewSecurityEventContext(c)
		Logger.LogUserRegistration(ctx, "", req.Email, false, "username already exists")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username already exists"})
		return
	}

	_, err = repository.FindUserByEmail(req.Email)
	if err == nil {
		ctx := logging.NewSecurityEventContext(c)
		Logger.LogUserRegistration(ctx, "", req.Email, false, "email already exists")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already exists"})
		return
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Password hashing failed"})
		return
	}

	user := models.User{
		Username:          req.Username,
		Email:             req.Email,
		FirstName:         req.FirstName,
		LastName:          req.LastName,
		PasswordHash:      hash,
		Role:              auth.RoleUser,
		IsConfirmed:       false,
		PasswordChangedAt: time.Now(),
		CreatedAt:         time.Now(),
	}

	if err := repository.CreateUser(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Saving email token failed"})
		return
	}

	// 👇 CONFIRMATION LINK
	confirmURL := fmt.Sprintf(
		"%s/confirm?token=%s",
		config.FrontendURL,
		tokenValue,
	)

	// Send email confirmation
	if err := utils.SendEmailConfirmationEmail(user.Email, confirmURL); err != nil {
		// Log but don't fail registration if email fails
		Logger.Application.Error().
			Err(err).
			Str("email", user.Email).
			Msg("Failed to send confirmation email")
	}

	// Log successful registration
	ctx := logging.NewSecurityEventContext(c)
	Logger.LogUserRegistration(ctx, user.ID.Hex(), user.Email, true, "")

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registration successful. Please confirm your email.",
	})

	go func() {
		notifBody, _ := json.Marshal(map[string]string{
			"userId":  user.ID.Hex(),
			"message": "Welcome! Please confirm your email: " + confirmURL,
		})

		req, _ := http.NewRequest(
			"POST",
			"http://notification-service:8003/api/notifications",
			bytes.NewBuffer(notifBody),
		)

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Service-API-Key", config.ServiceAPIKey)

		http.DefaultClient.Do(req)
	}()
}
