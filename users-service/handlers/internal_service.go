package handlers

import (
	"net/http"
	"strings"
	"users-service/repository"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// InternalUserExists checks whether a user exists.
// This endpoint is intended for service-to-service calls only.
func InternalUserExists(c *gin.Context) {
	userIDStr := strings.TrimSpace(c.Param("id"))
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID", "exists": false})
		return
	}

	_, err = repository.FindUserByID(userID)
	if err == mongo.ErrNoDocuments {
		c.JSON(http.StatusNotFound, gin.H{"exists": false})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check user existence"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"exists": true})
}
