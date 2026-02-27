package handlers

import (
	"net/http"

	"content-service/models"
	"content-service/repository"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CreateArtistRequest struct {
	Name      string   `json:"name" binding:"required,min=1,max=200"`
	Biography string   `json:"biography" binding:"max=5000"`
	Genres    []string `json:"genres" binding:"max=10,dive,min=1,max=50"`
}

func CreateArtist(c *gin.Context) {
	var req CreateArtistRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	artist := models.Artist{
		ID:        primitive.NewObjectID(),
		Name:      req.Name,
		Biography: req.Biography,
		Genres:    req.Genres,
	}

	if err := repository.CreateArtist(artist); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create artist"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Artist created",
	})

	emitRecommendationEvent("artist.created", map[string]interface{}{
		"artistId": artist.ID.Hex(),
		"name":     artist.Name,
		"genres":   artist.Genres,
	})
	emitSubscriptionEvent("artist.created", map[string]interface{}{
		"artistId": artist.ID.Hex(),
		"name":     artist.Name,
		"genres":   artist.Genres,
	})
}
