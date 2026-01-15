package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"shared-utils/validation"
	"users-service/config"
	"users-service/db"
	"users-service/models"
	"users-service/repository"
	"users-service/utils"

	"go.mongodb.org/mongo-driver/bson"
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

	now := time.Now()

	// If account is temporarily locked (e.g., after password expiry), deny login.
	if user.PasswordLockUntil != nil && now.Before(*user.PasswordLockUntil) {
		c.JSON(http.StatusForbidden, gin.H{
			"error":       "Login temporarily disabled. Please try again later.",
			"lockedUntil": user.PasswordLockUntil.Format(time.RFC3339),
		})
		return
	}

	// Enforce password max age (default 60 days). After expiry, lock login for a short period.
	if config.PasswordMaxAge > 0 && now.After(user.PasswordChangedAt.Add(config.PasswordMaxAge)) {
		expiredAt := user.PasswordChangedAt.Add(config.PasswordMaxAge)
		lockUntil := expiredAt.Add(config.PasswordExpiryLock)

		// Persist lockUntil for auditability; do not shorten an existing lock.
		if user.PasswordLockUntil == nil || user.PasswordLockUntil.Before(lockUntil) {
			_, _ = db.UsersCollection.UpdateOne(
				c.Request.Context(),
				bson.M{"_id": user.ID},
				bson.M{"$set": bson.M{"passwordLockUntil": lockUntil}},
			)
			user.PasswordLockUntil = &lockUntil
		}

		if now.Before(lockUntil) {
			c.JSON(http.StatusForbidden, gin.H{
				"error":       "Password expired. Login temporarily disabled.",
				"lockedUntil": lockUntil.Format(time.RFC3339),
			})
			return
		}

		c.JSON(http.StatusForbidden, gin.H{
			"error": "Password expired. Please reset your password.",
		})
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
