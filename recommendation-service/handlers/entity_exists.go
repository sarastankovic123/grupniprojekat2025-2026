package handlers

import (
	"net/http"
	"strings"

	"recommendation-service/repository"
	"shared-utils/validation"

	"github.com/gin-gonic/gin"
)

func InternalSongExists(c *gin.Context) {
	songID := strings.TrimSpace(c.Param("id"))
	if err := validation.ValidateObjectIDFormat(songID, "song ID"); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "exists": false})
		return
	}

	exists, err := repository.SongExistsByID(songID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check song", "exists": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"exists": exists})
}

func InternalArtistExists(c *gin.Context) {
	artistID := strings.TrimSpace(c.Param("id"))
	if err := validation.ValidateObjectIDFormat(artistID, "artist ID"); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "exists": false})
		return
	}

	exists, err := repository.ArtistExistsByID(artistID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check artist", "exists": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"exists": exists})
}
