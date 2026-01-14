package handlers

import (
	"net/http"

	"content-service/repository"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func DeleteArtist(c *gin.Context) {
	id := c.Param("id")

	// Convert to ObjectID to check for dependent albums
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid artist ID"})
		return
	}

	// Check for dependent albums
	albumCount, err := repository.CountAlbumsByArtistID(objID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check dependencies"})
		return
	}

	if albumCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Cannot delete artist with existing albums"})
		return
	}

	// Proceed with deletion
	if err := repository.DeleteArtist(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Artist deleted"})
}
