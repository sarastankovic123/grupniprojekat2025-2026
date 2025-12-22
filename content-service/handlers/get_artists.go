package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"content-service/models"
	"content-service/repository"
)

func GetArtists(c *gin.Context) {
	artists, err := repository.GetAllArtists()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch artists",
		})
		return
	}

	if artists == nil {
		artists = []models.Artist{}
	}

	c.JSON(http.StatusOK, artists)
}
