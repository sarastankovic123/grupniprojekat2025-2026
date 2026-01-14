package handlers

import (
	"net/http"

	"content-service/repository"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func DeleteAlbum(c *gin.Context) {
	id := c.Param("id")

	// Convert to ObjectID to check for dependent songs
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid album ID"})
		return
	}

	// Check for dependent songs
	songCount, err := repository.CountSongsByAlbumID(objID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check dependencies"})
		return
	}

	if songCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Cannot delete album with existing songs"})
		return
	}

	// Proceed with deletion
	if err := repository.DeleteAlbum(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Album deleted"})
}
