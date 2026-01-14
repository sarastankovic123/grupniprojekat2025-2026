package handlers

import (
	"net/http"
	"strings"

	"content-service/models"
	"content-service/repository"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UpdateAlbumRequest struct {
	Title       string   `json:"title" binding:"required,min=1,max=200"`
	ReleaseDate string   `json:"releaseDate" binding:"omitempty,dateformat"`
	Genres      []string `json:"genres" binding:"max=10,dive,min=1,max=50"`
	ArtistID    string   `json:"artistId" binding:"required,len=24,hexadecimal"`
}

func UpdateAlbum(c *gin.Context) {
	id := strings.TrimSpace(c.Param("id"))

	var req UpdateAlbumRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	req.ReleaseDate = strings.TrimSpace(req.ReleaseDate)
	req.ArtistID = strings.TrimSpace(req.ArtistID)

	if req.Title == "" || req.ArtistID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields: title, artistId"})
		return
	}

	// Trim genres
	for i := range req.Genres {
		req.Genres[i] = strings.TrimSpace(req.Genres[i])
	}

	// Validate artistId exists
	artistObjID, err := primitive.ObjectIDFromHex(req.ArtistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid artistId"})
		return
	}

	exists, err := repository.ArtistExistsByID(artistObjID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate artist"})
		return
	}
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Artist does not exist"})
		return
	}

	album := models.Album{
		Title:       req.Title,
		ReleaseDate: req.ReleaseDate,
		Genres:      req.Genres,
		ArtistID:    artistObjID,
	}

	if err := repository.UpdateAlbum(id, album); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Album updated"})
}
