package handlers

import (
	"net/http"
	"strings"

	"content-service/repository"

	"github.com/gin-gonic/gin"
)

func GetSongsByAlbum(c *gin.Context) {
	albumID := c.Param("id")
	searchQuery := strings.TrimSpace(c.Query("search"))

	songs, err := repository.SearchSongsByAlbumID(albumID, searchQuery)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to fetch songs for album",
		})
		return
	}

	c.JSON(http.StatusOK, songs)
}
