package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"content-service/models"
	"content-service/repository"
)

type CreateSongRequest struct {
	Name     string `json:"name" binding:"required"`
	Duration int    `json:"duration" binding:"required"`
	Genre    string `json:"genre" binding:"required"`
	AlbumID  string `json:"albumId" binding:"required"`
}

type UpdateSongRequest struct {
	Name     string `json:"name" binding:"required"`
	Duration int    `json:"duration" binding:"required"`
	Genre    string `json:"genre" binding:"required"`
	AlbumID  string `json:"albumId" binding:"required"`
}

func CreateSong(c *gin.Context) {
	var req CreateSongRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	albumObjID, err := primitive.ObjectIDFromHex(req.AlbumID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid album ID"})
		return
	}

	if req.Duration <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Duration must be positive"})
		return
	}

	song := models.Song{
		Name:     req.Name,
		Duration: req.Duration,
		Genre:    req.Genre,
		AlbumID:  albumObjID,
	}

	createdSong, err := repository.CreateSong(song)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create song"})
		return
	}

	c.JSON(http.StatusCreated, createdSong)
}

func GetAllSongs(c *gin.Context) {
	songs, err := repository.GetAllSongs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch songs"})
		return
	}

	if songs == nil {
		songs = []models.Song{}
	}

	c.JSON(http.StatusOK, songs)
}

func GetSongByID(c *gin.Context) {
	id := c.Param("id")

	song, err := repository.GetSongByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Song not found"})
		return
	}

	c.JSON(http.StatusOK, song)
}

func UpdateSong(c *gin.Context) {
	id := c.Param("id")

	var req UpdateSongRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	albumObjID, err := primitive.ObjectIDFromHex(req.AlbumID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid album ID"})
		return
	}

	if req.Duration <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Duration must be positive"})
		return
	}

	song := models.Song{
		Name:     req.Name,
		Duration: req.Duration,
		Genre:    req.Genre,
		AlbumID:  albumObjID,
	}

	err = repository.UpdateSong(id, song)
	if err != nil {
		if err.Error() == "song not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Song not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update song"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Song updated successfully"})
}

func DeleteSong(c *gin.Context) {
	id := c.Param("id")

	err := repository.DeleteSong(id)
	if err != nil {
		if err.Error() == "song not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Song not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete song"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Song deleted successfully"})
}

func GetSongsByAlbum(c *gin.Context) {
	albumID := c.Param("id")

	songs, err := repository.GetSongsByAlbumID(albumID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to fetch songs for album"})
		return
	}

	if songs == nil {
		songs = []models.Song{}
	}

	c.JSON(http.StatusOK, songs)
}
