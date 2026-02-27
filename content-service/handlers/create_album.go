package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"content-service/models"
	"content-service/repository"
	"shared-utils/validation"
)

type CreateAlbumRequest struct {
	Title       string   `json:"title" binding:"required,min=1,max=200"`
	ReleaseDate string   `json:"releaseDate" binding:"omitempty,dateformat"`
	Genres      []string `json:"genres" binding:"max=10,dive,min=1,max=50"`
	ArtistID    string   `json:"artistId" binding:"required,len=24,hexadecimal"`
}

type CreateAlbumForArtistRequest struct {
	Title       string   `json:"title" binding:"required,min=1,max=200"`
	ReleaseDate string   `json:"releaseDate" binding:"omitempty,dateformat"`
	Genres      []string `json:"genres" binding:"max=10,dive,min=1,max=50"`
}

func CreateAlbum(c *gin.Context) {
	var req CreateAlbumRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	req.ArtistID = strings.TrimSpace(req.ArtistID)

	if req.Title == "" || req.ArtistID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields: title, artistId"})
		return
	}

	artistObjID, err := primitive.ObjectIDFromHex(req.ArtistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid artistId"})
		return
	}

	exists, err := repository.ArtistExistsByID(artistObjID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate artist"})
		return
	}
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Artist does not exist"})
		return
	}

	album := models.Album{
		Title:       req.Title,
		ReleaseDate: req.ReleaseDate,
		Genres:      req.Genres,
		ArtistID:    artistObjID,
	}

	created, err := repository.CreateAlbum(album)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create album"})
		return
	}

	c.JSON(http.StatusCreated, created)

	emitRecommendationEvent("album.created", map[string]interface{}{
		"albumId":  created.ID.Hex(),
		"artistId": created.ArtistID.Hex(),
		"title":    created.Title,
		"genres":   created.Genres,
	})

	// Notify subscribers about new album (async, non-blocking)
	go func() {
		artist, err := repository.GetArtistByID(created.ArtistID.Hex())
		if err != nil {
			return
		}

		subscriberMap := make(map[string]bool)

		artistSubs, err := repository.GetArtistSubscribers(created.ArtistID)
		if err == nil {
			for _, userID := range artistSubs {
				subscriberMap[userID.Hex()] = true
			}
		}

		allGenres := append(created.Genres, artist.Genres...)
		for _, genre := range allGenres {
			genreSubs, err := repository.GetGenreSubscribers(genre)
			if err == nil {
				for _, userID := range genreSubs {
					subscriberMap[userID.Hex()] = true
				}
			}
		}

		sanitizedTitle := validation.SanitizeForHTML(created.Title)
		sanitizedArtist := validation.SanitizeForHTML(artist.Name)
		message := fmt.Sprintf("New album: %s by %s", sanitizedTitle, sanitizedArtist)

		for userIDHex := range subscriberMap {
			sendNotification(userIDHex, message)
		}
	}()
}

func CreateAlbumForArtist(c *gin.Context) {
	artistID := strings.TrimSpace(c.Param("id"))
	if artistID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing artist id"})
		return
	}

	var req CreateAlbumForArtistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields: title"})
		return
	}

	artistObjID, err := primitive.ObjectIDFromHex(artistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid artistId"})
		return
	}

	exists, err := repository.ArtistExistsByID(artistObjID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate artist"})
		return
	}
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Artist does not exist"})
		return
	}

	album := models.Album{
		Title:       req.Title,
		ReleaseDate: req.ReleaseDate,
		Genres:      req.Genres,
		ArtistID:    artistObjID,
	}

	created, err := repository.CreateAlbum(album)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create album"})
		return
	}

	c.JSON(http.StatusCreated, created)

	emitRecommendationEvent("album.created", map[string]interface{}{
		"albumId":  created.ID.Hex(),
		"artistId": created.ArtistID.Hex(),
		"title":    created.Title,
		"genres":   created.Genres,
	})

	// Notify subscribers about new album (async, non-blocking)
	go func() {
		// Get artist details
		artist, err := repository.GetArtistByID(created.ArtistID.Hex())
		if err != nil {
			return
		}

		// Collect unique subscriber user IDs
		subscriberMap := make(map[string]bool)

		artistSubs, err := repository.GetArtistSubscribers(created.ArtistID)
		if err == nil {
			for _, userID := range artistSubs {
				subscriberMap[userID.Hex()] = true
			}
		}

		allGenres := append(created.Genres, artist.Genres...)
		for _, genre := range allGenres {
			genreSubs, err := repository.GetGenreSubscribers(genre)
			if err == nil {
				for _, userID := range genreSubs {
					subscriberMap[userID.Hex()] = true
				}
			}
		}

		sanitizedTitle := validation.SanitizeForHTML(created.Title)
		sanitizedArtist := validation.SanitizeForHTML(artist.Name)
		message := fmt.Sprintf("New album: %s by %s", sanitizedTitle, sanitizedArtist)

		for userIDHex := range subscriberMap {
			sendNotification(userIDHex, message)
		}
	}()
}
