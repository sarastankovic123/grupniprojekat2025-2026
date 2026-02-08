package handlers

import (
	"fmt"
	"net/http"

	"content-service/models"
	"content-service/repository"
	"shared-utils/validation"

	"github.com/gin-gonic/gin"
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

	// Notify genre subscribers about new artist (async, non-blocking)
	// Note: Artist has no subscribers yet (just created), so only notify genre subscribers
	go func() {
		// Collect unique subscriber user IDs from genre subscriptions
		subscriberMap := make(map[string]bool)

		for _, genre := range req.Genres {
			genreSubs, err := repository.GetGenreSubscribers(genre)
			if err == nil {
				for _, userID := range genreSubs {
					subscriberMap[userID.Hex()] = true
				}
			}
		}

		// Send notification to each unique subscriber
		sanitizedName := validation.SanitizeForHTML(req.Name)
		message := fmt.Sprintf("New artist added: %s", sanitizedName)

		for userIDHex := range subscriberMap {
			sendNotification(userIDHex, message)
		}
	}()
}
