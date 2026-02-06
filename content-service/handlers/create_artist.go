package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"content-service/config"
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

	// Notify admin about new artist (async, non-blocking)
	go func() {
		userID, exists := c.Get("userID")
		if exists {
			// SECURITY FIX: HTML escape name to prevent XSS
			sanitizedName := validation.SanitizeForHTML(req.Name)
			notifBody, _ := json.Marshal(map[string]string{
				"userId":  userID.(string),
				"message": fmt.Sprintf("New artist created: %s", sanitizedName),
			})
			req, _ := http.NewRequest("POST", "https://localhost:8003/api/notifications", bytes.NewBuffer(notifBody))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("X-Service-API-Key", config.ServiceAPIKey)
			http.DefaultClient.Do(req)
		}
	}()
}
