package handlers

import (
	"net/http"

	"content-service/repository"
	"github.com/gin-gonic/gin"
)

func GetAlbumsByArtist(c *gin.Context) {
	artistID := c.Param("id")

	albums, err := repository.GetAlbumsByArtistID(artistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to fetch albums for artist",
		})
		return
	}

	c.JSON(http.StatusOK, albums)
}
