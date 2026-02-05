package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"content-service/repository"
)

func GetGenres(c *gin.Context) {
	genres, err := repository.GetAllGenres()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch genres",
		})
		return
	}

	if genres == nil {
		genres = []string{}
	}

	c.JSON(http.StatusOK, genres)
}
