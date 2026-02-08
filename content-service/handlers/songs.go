package handlers

import (
	"content-service/models"
	"content-service/repository"
	"fmt"
	"net/http"
	"shared-utils/validation"
	"strings"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CreateSongRequest struct {
	Title    string `json:"title" binding:"required,min=1,max=200"`
	Duration int    `json:"duration" binding:"required,min=1,max=7200"`
	AlbumID  string `json:"albumId" binding:"required,len=24,hexadecimal"`
}

type CreateSongForAlbumRequest struct {
	Title    string `json:"title" binding:"required,min=1,max=200"`
	Duration int    `json:"duration" binding:"required,min=1,max=7200"`
}

type UpdateSongRequest struct {
	Title    string `json:"title" binding:"required,min=1,max=200"`
	Duration int    `json:"duration"`
	AlbumID  string `json:"albumId"`
}

func GetSongs(c *gin.Context) {
	// Parse search query parameter
	searchQuery := strings.TrimSpace(c.Query("search"))

	var songs []models.Song
	var err error

	if searchQuery != "" {
		songs, err = repository.SearchSongs(searchQuery)
	} else {
		songs, err = repository.GetAllSongs()
	}

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
		Duration: fmt.Sprintf("%d", req.Duration),
		AlbumID:  albumObjID,
	}

	created, err := repository.CreateSong(song)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create song"})
		return
	}

	c.JSON(http.StatusCreated, created)

	// Notify subscribers about new song (async, non-blocking)
	go func() {
		// Get album and artist details
		album, err := repository.GetAlbumByID(created.AlbumID.Hex())
		if err != nil {
			return
		}

		artist, err := repository.GetArtistByID(album.ArtistID.Hex())
		if err != nil {
			return
		}

		// Collect unique subscriber user IDs (deduplicate users subscribed to both artist and genre)
		subscriberMap := make(map[string]bool)

		// 1. Get artist subscribers
		artistSubs, err := repository.GetArtistSubscribers(album.ArtistID)
		if err == nil {
			for _, userID := range artistSubs {
				subscriberMap[userID.Hex()] = true
			}
		}

		// 2. Get genre subscribers (check both album and artist genres)
		allGenres := append(album.Genres, artist.Genres...)
		for _, genre := range allGenres {
			genreSubs, err := repository.GetGenreSubscribers(genre)
			if err == nil {
				for _, userID := range genreSubs {
					subscriberMap[userID.Hex()] = true
				}
			}
		}

		// 3. Send notification to each unique subscriber
		sanitizedTitle := validation.SanitizeForHTML(created.Title)
		sanitizedArtist := validation.SanitizeForHTML(artist.Name)
		message := fmt.Sprintf("New song: %s by %s", sanitizedTitle, sanitizedArtist)

		for userIDHex := range subscriberMap {
			sendNotification(userIDHex, message)
		}
	}()
}

func CreateSongForAlbum(c *gin.Context) {
	albumID := strings.TrimSpace(c.Param("id"))
	if albumID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing album id"})
		return
	}

	var req CreateSongForAlbumRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields: title"})
		return
	}

	albumObjID, err := primitive.ObjectIDFromHex(albumID)
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
		Duration: fmt.Sprintf("%d", req.Duration),
		AlbumID:  albumObjID,
	}

	created, err := repository.CreateSong(song)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create song"})
		return
	}

	c.JSON(http.StatusCreated, created)

	// Notify subscribers about new song (async, non-blocking)
	go func() {
		// Get album and artist details
		album, err := repository.GetAlbumByID(created.AlbumID.Hex())
		if err != nil {
			return
		}

		artist, err := repository.GetArtistByID(album.ArtistID.Hex())
		if err != nil {
			return
		}

		// Collect unique subscriber user IDs (deduplicate users subscribed to both artist and genre)
		subscriberMap := make(map[string]bool)

		// 1. Get artist subscribers
		artistSubs, err := repository.GetArtistSubscribers(album.ArtistID)
		if err == nil {
			for _, userID := range artistSubs {
				subscriberMap[userID.Hex()] = true
			}
		}

		// 2. Get genre subscribers (check both album and artist genres)
		allGenres := append(album.Genres, artist.Genres...)
		for _, genre := range allGenres {
			genreSubs, err := repository.GetGenreSubscribers(genre)
			if err == nil {
				for _, userID := range genreSubs {
					subscriberMap[userID.Hex()] = true
				}
			}
		}

		// 3. Send notification to each unique subscriber
		sanitizedTitle := validation.SanitizeForHTML(created.Title)
		sanitizedArtist := validation.SanitizeForHTML(artist.Name)
		message := fmt.Sprintf("New song: %s by %s", sanitizedTitle, sanitizedArtist)

		for userIDHex := range subscriberMap {
			sendNotification(userIDHex, message)
		}
	}()
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
		Duration: fmt.Sprintf("%d", req.Duration),
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
