package handlers

import (
	"net/http"

	"content-service/repository"

	"github.com/gin-gonic/gin"
)

func GetSongsByAlbum(c *gin.Context) {
	albumID := c.Param("id")

	songs, err := repository.GetSongsByAlbumID(albumID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to fetch songs for album",
		})
		return
	}

	c.JSON(http.StatusOK, songs)
}
