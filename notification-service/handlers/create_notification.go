package handlers

import (
	"net/http"
	"strings"

	"notification-service/models"
	"notification-service/repository"
	"shared-utils/validation"

	"github.com/gin-gonic/gin"
)

type CreateNotificationRequest struct {
	UserID  string `json:"userId" binding:"required,len=24,hexadecimal"`
	Message string `json:"message" binding:"required,min=1,max=1000"`
}

func CreateNotification(c *gin.Context) {
	var req CreateNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": validation.FormatValidationError(err)})
		return
	}

	// Trim inputs
	req.UserID = strings.TrimSpace(req.UserID)
	req.Message = strings.TrimSpace(req.Message)

	// CRITICAL SECURITY FIX: Sanitize message to prevent XSS
	req.Message = validation.SanitizeForHTML(req.Message)

	// Strip control characters from message
	req.Message = validation.StripControlCharacters(req.Message)

	if req.UserID == "" || req.Message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields: userId, message"})
		return
	}

	notification := models.Notification{
		UserID:  req.UserID,
		Message: req.Message,
		IsRead:  false,
	}

	if err := repository.CreateNotification(notification); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Notification created"})
}
