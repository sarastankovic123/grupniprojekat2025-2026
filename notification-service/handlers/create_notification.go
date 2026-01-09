package handlers

import (
	"net/http"
	"strings"

	"notification-service/models"
	"notification-service/repository"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CreateNotificationRequest struct {
	UserID  string `json:"userId"`
	Message string `json:"message"`
}

func CreateNotification(c *gin.Context) {
	var req CreateNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	req.UserID = strings.TrimSpace(req.UserID)
	req.Message = strings.TrimSpace(req.Message)

	if req.UserID == "" || req.Message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields: userId, message"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid userId"})
		return
	}

	notification := models.Notification{
		UserID:  userObjID,
		Message: req.Message,
		IsRead:  false,
	}

	if err := repository.CreateNotification(notification); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Notification created"})
}
