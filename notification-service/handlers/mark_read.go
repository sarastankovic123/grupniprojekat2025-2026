package handlers

import (
	"net/http"
	"strings"

	"notification-service/repository"
	"shared-utils/validation"

	"github.com/gin-gonic/gin"
)

func MarkAsRead(c *gin.Context) {
	id := strings.TrimSpace(c.Param("id"))

	if err := validation.ValidateObjectIDFormat(id, "notification ID"); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userIDStr := userID.(string)

	notification, err := repository.GetNotificationByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	if notification.UserID != userIDStr {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	if err := repository.UpdateNotificationReadStatus(id, true); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}
