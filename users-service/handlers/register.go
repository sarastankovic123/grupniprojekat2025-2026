package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"shared-utils/validation"
	"users-service/config"
	"users-service/models"
	"users-service/repository"
	"users-service/utils"
)

func Register(c *gin.Context) {
	var req RegisterRequest

	// Validate request using struct tags
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": validation.FormatValidationError(err)})
		return
	}

	// Trim all string inputs
	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(req.Email)
	req.FirstName = strings.TrimSpace(req.FirstName)
	req.LastName = strings.TrimSpace(req.LastName)

	// Strip control characters from names
	req.FirstName = validation.StripControlCharacters(req.FirstName)
	req.LastName = validation.StripControlCharacters(req.LastName)

	// Additional email validation (redundant with struct tags but keeping for extra safety)
	if !utils.IsValidEmail(req.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})
		return
	}

	// Password strength validation (struct tags handle min length and match)
	if !utils.IsStrongPassword(req.Password) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must contain uppercase, lowercase, number, and special character"})
		return
	}

	// Check username uniqueness
	_, err := repository.FindUserByUsername(req.Username)
	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username already exists"})
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
		Role:              "USER",
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

	confirmationLink := "http://localhost:5173/confirm?token=" + tokenValue

	fmt.Println("CONFIRM LINK:", confirmationLink)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registration successful. Please confirm your email.",
		"token":   tokenValue,
	})

	// Send welcome notification (async, non-blocking)
	go func() {
		notifBody, _ := json.Marshal(map[string]string{
			"userId":  user.ID.Hex(),
			"message": "Welcome! Your account has been created. Please confirm your email.",
		})
		req, _ := http.NewRequest("POST", "http://localhost:8003/api/notifications", bytes.NewBuffer(notifBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Service-API-Key", config.ServiceAPIKey)
		http.DefaultClient.Do(req)
	}()

}
