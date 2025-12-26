package handlers


import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"users-service/models"
	"users-service/repository"
	"users-service/utils"
)


type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
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
