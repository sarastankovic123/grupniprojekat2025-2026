package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"users-service/repository"
	"users-service/utils"
)

type VerifyOTPRequest struct {
	Email string `json:"email"`
	OTP   string `json:"otp"`
}

func VerifyOTP(c *gin.Context) {
	var req VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	user, err := repository.FindUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	tokenDoc, err := repository.FindEmailToken(req.OTP)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	if tokenDoc.UserID != user.ID {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	if time.Now().After(tokenDoc.ExpiresAt) {
		_ = repository.DeleteEmailToken(req.OTP)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	_ = repository.DeleteEmailToken(req.OTP)

	accessToken, err := utils.GenerateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"accessToken": accessToken,
	})

	// Send login success notification (async, non-blocking)
	go func() {
		notifBody, _ := json.Marshal(map[string]string{
			"userId":  user.ID.Hex(),
			"message": fmt.Sprintf("Login successful at %s", time.Now().Format("2006-01-02 15:04:05")),
		})
		http.Post("http://localhost:8003/api/notifications", "application/json", bytes.NewBuffer(notifBody))
	}()
}
