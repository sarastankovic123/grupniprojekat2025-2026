package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"shared-utils/httpclient"
	"shared-utils/logging"
	"users-service/config"
	"users-service/models"
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
		ctx := logging.NewSecurityEventContext(c)
		Logger.LogOTPEvent(ctx, "auth_otp_failed", false, "user not found")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	tokenDoc, err := repository.FindEmailToken(req.OTP)
	if err != nil {
		ctx := logging.NewSecurityEventContext(c)
		c.Set("user_id", user.ID.Hex())
		c.Set("email", user.Email)
		ctx = logging.NewSecurityEventContext(c)
		Logger.LogOTPEvent(ctx, "auth_otp_failed", false, "invalid OTP")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	if tokenDoc.UserID != user.ID {
		ctx := logging.NewSecurityEventContext(c)
		c.Set("user_id", user.ID.Hex())
		c.Set("email", user.Email)
		ctx = logging.NewSecurityEventContext(c)
		Logger.LogOTPEvent(ctx, "auth_otp_failed", false, "user ID mismatch")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	if time.Now().After(tokenDoc.ExpiresAt) {
		_ = repository.DeleteEmailToken(req.OTP)
		ctx := logging.NewSecurityEventContext(c)
		c.Set("user_id", user.ID.Hex())
		c.Set("email", user.Email)
		ctx = logging.NewSecurityEventContext(c)
		Logger.LogOTPEvent(ctx, "auth_otp_failed", false, "expired OTP")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	_ = repository.DeleteEmailToken(req.OTP)

	// Generate access token
	accessToken, err := utils.GenerateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
		return
	}

	// Generate refresh token
	refreshTokenString, err := utils.GenerateRefreshToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	// Store refresh token in database
	refreshToken := &models.RefreshToken{
		UserID:    user.ID,
		Token:     refreshTokenString,
		ExpiresAt: time.Now().Add(config.JWTRefreshExpiry),
	}
	if err := repository.CreateRefreshToken(refreshToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store refresh token"})
		return
	}

	// Set httpOnly cookies
	c.SetCookie(
		"access_token",
		accessToken,
		int(config.JWTAccessExpiry.Seconds()),
		"/",
		"",
		false, // Set to true in production with HTTPS
		true,  // httpOnly
	)
	c.SetSameSite(http.SameSiteStrictMode)

	c.SetCookie(
		"refresh_token",
		refreshTokenString,
		int(config.JWTRefreshExpiry.Seconds()),
		"/",
		"",
		false, // Set to true in production with HTTPS
		true,  // httpOnly
	)

	// Log successful OTP verification
	ctx := logging.NewSecurityEventContext(c)
	c.Set("user_id", user.ID.Hex())
	c.Set("email", user.Email)
	ctx = logging.NewSecurityEventContext(c)
	Logger.LogOTPEvent(ctx, "auth_otp_verified", true, "")

	c.JSON(http.StatusOK, gin.H{
		"message":      "Login successful",
		"accessToken":  accessToken,
		"refreshToken": refreshTokenString,
	})

	// Send login success notification (async, non-blocking)
	go func() {
		if NotificationsClient == nil {
			return
		}

		payload := map[string]string{
			"userId":  user.ID.Hex(),
			"message": fmt.Sprintf("Login successful at %s", time.Now().Format("2006-01-02 15:04:05")),
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
			Logger.Application.Warn().Err(err).Msg("Failed to send notification (verify otp)")
		}
	}()
}
