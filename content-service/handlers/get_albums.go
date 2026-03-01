package handlers

import (
	"net/http"
	"strings"

	"content-service/repository"
	"github.com/gin-gonic/gin"
)

func GetAlbumsByArtist(c *gin.Context) {
	artistID := c.Param("id")
	searchQuery := strings.TrimSpace(c.Query("search"))

	albums, err := repository.SearchAlbumsByArtistID(artistID, searchQuery)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to fetch albums for artist",
		})
		return
	}

	c.JSON(http.StatusOK, albums)
}
