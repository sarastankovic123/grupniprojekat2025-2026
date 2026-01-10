package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"shared-utils/validation"
	"users-service/models"
	"users-service/repository"
	"users-service/utils"
)

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email,min=5,max=255"`
	Password string `json:"password" binding:"required,min=8,max=128"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": validation.FormatValidationError(err)})
		return
	}

	// Trim email input
	req.Email = strings.TrimSpace(req.Email)

	// Additional email validation before database query
	if !utils.IsValidEmail(req.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})
		return
	}

	user, err := repository.FindUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !utils.CheckPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !user.IsConfirmed {
		c.JSON(http.StatusForbidden, gin.H{"error": "Email is not confirmed"})
		return
	}

	otp := utils.GenerateOTP()
	fmt.Println("OTP:", otp)

	tokenDoc := models.EmailConfirmationToken{
		UserID:    user.ID,
		Token:     otp,
		ExpiresAt: time.Now().Add(5 * time.Minute),
		CreatedAt: time.Now(),
	}

	if err := repository.SaveEmailToken(tokenDoc); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create OTP"})
		return
	}

	if err := utils.SendOTPEmail(user.Email, otp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "OTP sent"})
}
