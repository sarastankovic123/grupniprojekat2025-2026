package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"content-service/models"
	"content-service/repository"
)

func GetArtists(c *gin.Context) {
	// Parse query parameters
	searchQuery := strings.TrimSpace(c.Query("search"))
	genresParam := strings.TrimSpace(c.Query("genres"))

	var genres []string
	if genresParam != "" {
		genres = strings.Split(genresParam, ",")
		for i, g := range genres {
			genres[i] = strings.TrimSpace(g)
		}
	}

	// Use search/filter if any parameters provided, otherwise get all
	var artists []models.Artist
	var err error

	if searchQuery != "" || len(genres) > 0 {
		artists, err = repository.SearchAndFilterArtists(searchQuery, genres)
	} else {
		artists, err = repository.GetAllArtists()
	}

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

func GetArtistByID(c *gin.Context) {
	id := c.Param("id")

	artist, err := repository.GetArtistByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Artist not found",
		})
		return
	}

	c.JSON(http.StatusOK, artist)
}
