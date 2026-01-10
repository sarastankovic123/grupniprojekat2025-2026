package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"content-service/config"
	"content-service/models"
	"content-service/repository"
	"github.com/gin-gonic/gin"
)

type CreateArtistRequest struct {
	Name      string   `json:"name"`
	Biography string   `json:"biography"`
	Genres    []string `json:"genres"`
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
			notifBody, _ := json.Marshal(map[string]string{
				"userId":  userID.(string),
				"message": fmt.Sprintf("New artist created: %s", req.Name),
			})
			req, _ := http.NewRequest("POST", "http://localhost:8003/api/notifications", bytes.NewBuffer(notifBody))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("X-Service-API-Key", config.ServiceAPIKey)
			http.DefaultClient.Do(req)
		}
	}()
}
