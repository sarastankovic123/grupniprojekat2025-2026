package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"content-service/config"
	"content-service/models"
	"content-service/repository"
	"shared-utils/validation"
)

type CreateAlbumRequest struct {
	Title       string   `json:"title" binding:"required,min=1,max=200"`
	ReleaseDate string   `json:"releaseDate" binding:"omitempty,dateformat"`
	Genres      []string `json:"genres" binding:"max=10,dive,min=1,max=50"`
	ArtistID    string   `json:"artistId" binding:"required,len=24,hexadecimal"`
}

func CreateAlbum(c *gin.Context) {
	var req CreateAlbumRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if req.Title == "" || req.ArtistID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields: title, artistId"})
		return
	}

	artistObjID, err := primitive.ObjectIDFromHex(req.ArtistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid artistId"})
		return
	}

	album := models.Album{
		Title:       req.Title,
		ReleaseDate: req.ReleaseDate,
		Genres:      req.Genres,
		ArtistID:    artistObjID,
	}

	created, err := repository.CreateAlbum(album)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create album"})
		return
	}

	c.JSON(http.StatusCreated, created)

	// Notify admin about new album (async, non-blocking)
	go func() {
		userID, exists := c.Get("userID")
		if exists {
			// SECURITY FIX: HTML escape title to prevent XSS
			sanitizedTitle := validation.SanitizeForHTML(req.Title)
			notifBody, _ := json.Marshal(map[string]string{
				"userId":  userID.(string),
				"message": fmt.Sprintf("New album created: %s", sanitizedTitle),
			})
			req, _ := http.NewRequest("POST", "http://localhost:8003/api/notifications", bytes.NewBuffer(notifBody))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("X-Service-API-Key", config.ServiceAPIKey)
			http.DefaultClient.Do(req)
		}
	}()
}
