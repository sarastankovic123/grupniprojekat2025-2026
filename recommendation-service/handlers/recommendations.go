package handlers

import (
	"net/http"

	"recommendation-service/models"
	"recommendation-service/repository"

	"github.com/gin-gonic/gin"
)

const defaultLimit = 20

func GetRecommendations(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDStr, ok := userID.(string)
	if !ok || userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ctx := c.Request.Context()

	// Query 1: Songs from subscribed genres
	subscribedSongs, err := repository.GetSubscribedGenreSongs(ctx, userIDStr, defaultLimit)
	if err != nil {
		Logger.Application.Error().Err(err).Msg("Failed to get subscribed genre recommendations")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get recommendations"})
		return
	}

	// Query 2: Songs from non-subscribed genres (discover)
	discoverSongs, err := repository.GetDiscoverNewSongs(ctx, userIDStr, defaultLimit)
	if err != nil {
		Logger.Application.Error().Err(err).Msg("Failed to get discover recommendations")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get recommendations"})
		return
	}

	// Return empty arrays instead of null
	if subscribedSongs == nil {
		subscribedSongs = []models.RecommendedSong{}
	}
	if discoverSongs == nil {
		discoverSongs = []models.RecommendedSong{}
	}

	c.JSON(http.StatusOK, models.RecommendationResponse{
		SubscribedGenreSongs: subscribedSongs,
		DiscoverNewSongs:     discoverSongs,
	})
}
