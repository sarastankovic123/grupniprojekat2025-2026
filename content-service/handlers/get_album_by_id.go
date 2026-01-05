package handlers

import (
	"net/http"

	"content-service/repository"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

func GetAlbumByID(c *gin.Context) {
	albumID := c.Param("id")

	album, err := repository.GetAlbumByID(albumID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Album not found",
			})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to fetch album",
		})
		return
	}

	c.JSON(http.StatusOK, album)
}
