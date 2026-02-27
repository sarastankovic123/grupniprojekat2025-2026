package handlers

import (
	"net/http"
	"strings"

	"content-service/models"
	"content-service/repository"

	"github.com/gin-gonic/gin"
)

type UpdateArtistRequest struct {
	Name      string   `json:"name" binding:"required,min=1,max=200"`
	Biography string   `json:"biography" binding:"max=5000"`
	Genres    []string `json:"genres" binding:"max=10,dive,min=1,max=50"`
}

func UpdateArtist(c *gin.Context) {
	id := strings.TrimSpace(c.Param("id"))

	var req UpdateArtistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Biography = strings.TrimSpace(req.Biography)

	if req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required field: name"})
		return
	}

	// Trim genres
	for i := range req.Genres {
		req.Genres[i] = strings.TrimSpace(req.Genres[i])
	}

	artist := models.Artist{
		Name:      req.Name,
		Biography: req.Biography,
		Genres:    req.Genres,
	}

	if err := repository.UpdateArtist(id, artist); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	emitRecommendationEvent("artist.updated", map[string]interface{}{
		"artistId": id,
		"name":     req.Name,
		"genres":   req.Genres,
	})

	c.JSON(http.StatusOK, gin.H{"message": "Artist updated"})
}
