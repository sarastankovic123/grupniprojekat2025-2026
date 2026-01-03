package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"content-service/models"
	"content-service/repository"
)

type CreateAlbumRequest struct {
	Title       string   `json:"title"`
	ReleaseDate string   `json:"releaseDate"`
	Genres      []string `json:"genres"`
	ArtistID    string   `json:"artistId"`
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
		Title:    req.Title,
		Release:  req.ReleaseDate,
		Genres:   req.Genres,
		ArtistID: artistObjID,
	}

	created, err := repository.CreateAlbum(album)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create album"})
		return
	}

	c.JSON(http.StatusCreated, created)
}
