package handlers

import (
	"net/http"
	"strings"

	"content-service/models"
	"content-service/repository"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)



type CreateSongRequest struct {
	Title    string   `json:"title"`
	Duration int      `json:"duration"`
	Genres   []string `json:"genres"`
	AlbumID  string   `json:"albumId"`
}

type UpdateSongRequest struct {
	Title    string   `json:"title"`
	Duration int      `json:"duration"`
	Genres   []string `json:"genres"`
	AlbumID  string   `json:"albumId"`
}



func GetSongs(c *gin.Context) {
	songs, err := repository.GetAllSongs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch songs"})
		return
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


func CreateSong(c *gin.Context) {
	var req CreateSongRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	req.AlbumID = strings.TrimSpace(req.AlbumID)

	if req.Title == "" || req.AlbumID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields: title, albumId"})
		return
	}

	albumObjID, err := primitive.ObjectIDFromHex(req.AlbumID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid albumId"})
		return
	}

	exists, err := repository.AlbumExistsByID(albumObjID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate album"})
		return
	}
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Album does not exist"})
		return
	}

	song := models.Song{
		Title:    req.Title,
		Duration: req.Duration,
		Genres:   req.Genres,
		AlbumID:  albumObjID,
	}

	created, err := repository.CreateSong(song)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create song"})
		return
	}

	c.JSON(http.StatusCreated, created)
}

func UpdateSong(c *gin.Context) {
	id := strings.TrimSpace(c.Param("id"))

	var req UpdateSongRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	req.AlbumID = strings.TrimSpace(req.AlbumID)

	if req.Title == "" || req.AlbumID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields: title, albumId"})
		return
	}

	albumObjID, err := primitive.ObjectIDFromHex(req.AlbumID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid albumId"})
		return
	}

	// Optional but good: album must exist even for update
	exists, err := repository.AlbumExistsByID(albumObjID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate album"})
		return
	}
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Album does not exist"})
		return
	}

	song := models.Song{
		Title:    req.Title,
		Duration: req.Duration,
		Genres:   req.Genres,
		AlbumID:  albumObjID,
	}

	if err := repository.UpdateSong(id, song); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Song updated"})
}

func DeleteSong(c *gin.Context) {
	id := c.Param("id")

	if err := repository.DeleteSong(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Song deleted"})
}

func GetSongsByAlbum(c *gin.Context) {
	albumID := c.Param("id")

	songs, err := repository.GetSongsByAlbumID(albumID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid album id"})
		return
	}

	c.JSON(http.StatusOK, songs)
}
