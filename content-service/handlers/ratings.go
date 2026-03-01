package handlers

import (
	"content-service/repository"
	"context"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func GetUserRating(c *gin.Context) {
	songIDStr := c.Param("id")
	songID, err := primitive.ObjectIDFromHex(songIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid song ID"})
		return
	}

	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDStr, ok := userIDVal.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID format"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	rating, err := repository.GetUserRating(userID, songID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rating"})
		return
	}

	if rating == nil {
		c.JSON(http.StatusOK, gin.H{"rating": nil}) // No rating found
		return
	}

	c.JSON(http.StatusOK, rating)
}

func SetRating(c *gin.Context) {
	songIDStr := c.Param("id")
	songID, err := primitive.ObjectIDFromHex(songIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid song ID"})
		return
	}

	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDStr, ok := userIDVal.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID format"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()
	if err := ensureUserExists(ctx, userIDStr); err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			c.JSON(http.StatusGatewayTimeout, gin.H{"error": "Timed out while verifying user"})
			return
		}
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to verify user"})
		return
	}

	var req struct {
		Rating int `json:"rating" binding:"required,min=1,max=5"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rating must be between 1 and 5"})
		return
	}

	song, err := repository.GetSongByID(songID.Hex())
	if err != nil || song == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Song not found"})
		return
	}

	rating, err := repository.UpsertRating(userID, songID, req.Rating)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save rating"})
		return
	}

	emitRecommendationEvent("song.rating.created_or_updated", map[string]interface{}{
		"userId": userID.Hex(),
		"songId": songID.Hex(),
		"rating": req.Rating,
	})

	c.JSON(http.StatusOK, rating)
}

func DeleteRating(c *gin.Context) {
	songIDStr := c.Param("id")
	songID, err := primitive.ObjectIDFromHex(songIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid song ID"})
		return
	}

	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDStr, ok := userIDVal.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID format"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	err = repository.DeleteRating(userID, songID)
	if err == mongo.ErrNoDocuments {
		c.JSON(http.StatusNotFound, gin.H{"error": "Rating not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete rating"})
		return
	}

	emitRecommendationEvent("song.rating.deleted", map[string]interface{}{
		"userId": userID.Hex(),
		"songId": songID.Hex(),
	})

	c.JSON(http.StatusOK, gin.H{"message": "Rating deleted successfully"})
}

func GetAverageRating(c *gin.Context) {
	songIDStr := c.Param("id")
	songID, err := primitive.ObjectIDFromHex(songIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid song ID"})
		return
	}

	avg, count, err := repository.GetAverageRating(songID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch average rating"})
		return
	}

	avgRounded := float64(int(avg*10+0.5)) / 10

	c.JSON(http.StatusOK, gin.H{
		"average": avgRounded,
		"count":   count,
		"songId":  songIDStr,
	})
}

func GetBulkRatings(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDStr, ok := userIDVal.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID format"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	songIDsParam := c.Query("songIds")
	if songIDsParam == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "songIds query parameter required"})
		return
	}

	songIDStrs := splitCommas(songIDsParam)
	songIDs := make([]primitive.ObjectID, 0, len(songIDStrs))

	for _, idStr := range songIDStrs {
		id, err := primitive.ObjectIDFromHex(idStr)
		if err != nil {
			continue // Skip invalid IDs
		}
		songIDs = append(songIDs, id)
	}

	if len(songIDs) == 0 {
		c.JSON(http.StatusOK, gin.H{"ratings": map[string]int{}})
		return
	}

	ratingsMap := make(map[string]int)
	for _, songID := range songIDs {
		rating, err := repository.GetUserRating(userID, songID)
		if err == nil && rating != nil {
			ratingsMap[songID.Hex()] = rating.Rating
		}
	}

	c.JSON(http.StatusOK, gin.H{"ratings": ratingsMap})
}

func splitCommas(s string) []string {
	var result []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == ',' {
			if i > start {
				result = append(result, s[start:i])
			}
			start = i + 1
		}
	}
	if start < len(s) {
		result = append(result, s[start:])
	}
	return result
}

func parseInt(s string, defaultVal int) int {
	if val, err := strconv.Atoi(s); err == nil {
		return val
	}
	return defaultVal
}
