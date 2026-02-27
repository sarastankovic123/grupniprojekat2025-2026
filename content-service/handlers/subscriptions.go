package handlers

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"content-service/models"
	"content-service/repository"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ============ ARTIST SUBSCRIPTIONS ============

// SubscribeToArtist subscribes the authenticated user to an artist
func SubscribeToArtist(c *gin.Context) {
	artistID := strings.TrimSpace(c.Param("id"))
	artistObjID, err := primitive.ObjectIDFromHex(artistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid artist ID"})
		return
	}

	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))

	// Synchronous service-to-service check: user must exist in users-service.
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()
	if err := ensureUserExists(ctx, userIDStr.(string)); err != nil {
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

	// Verify artist exists before allowing subscription
	artist, err := repository.GetArtistByID(artistObjID.Hex())
	if err != nil || artist == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Artist not found"})
		return
	}

	subscription, err := repository.SubscribeToArtist(userID, artistObjID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to subscribe"})
		return
	}

	c.JSON(http.StatusOK, subscription)
}

// UnsubscribeFromArtist removes the authenticated user's subscription to an artist
func UnsubscribeFromArtist(c *gin.Context) {
	artistID := strings.TrimSpace(c.Param("id"))
	artistObjID, err := primitive.ObjectIDFromHex(artistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid artist ID"})
		return
	}

	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))

	err = repository.UnsubscribeFromArtist(userID, artistObjID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unsubscribe"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Unsubscribed successfully"})
}

// GetArtistSubscriptionStatus checks if the authenticated user is subscribed to an artist
func GetArtistSubscriptionStatus(c *gin.Context) {
	artistID := strings.TrimSpace(c.Param("id"))
	artistObjID, err := primitive.ObjectIDFromHex(artistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid artist ID"})
		return
	}

	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))

	isSubscribed, err := repository.IsSubscribedToArtist(userID, artistObjID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check subscription"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"isSubscribed": isSubscribed})
}

// GetUserArtistSubscriptions returns all artist subscriptions for the authenticated user
// with enriched data (artist names, genres)
func GetUserArtistSubscriptions(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))

	subscriptions, err := repository.GetUserArtistSubscriptionsWithDetails(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch subscriptions"})
		return
	}

	// Ensure empty array instead of null in JSON response
	if subscriptions == nil {
		subscriptions = []models.ArtistSubscriptionDetail{}
	}

	c.JSON(http.StatusOK, subscriptions)
}

// ============ GENRE SUBSCRIPTIONS ============

// SubscribeToGenre subscribes the authenticated user to a genre
func SubscribeToGenre(c *gin.Context) {
	genre := strings.TrimSpace(c.Param("genre"))
	if genre == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre"})
		return
	}

	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))

	subscription, err := repository.SubscribeToGenre(userID, genre)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to subscribe"})
		return
	}

	c.JSON(http.StatusOK, subscription)
}

// UnsubscribeFromGenre removes the authenticated user's subscription to a genre
func UnsubscribeFromGenre(c *gin.Context) {
	genre := strings.TrimSpace(c.Param("genre"))
	if genre == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre"})
		return
	}

	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))

	err := repository.UnsubscribeFromGenre(userID, genre)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unsubscribe"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Unsubscribed successfully"})
}

// GetGenreSubscriptionStatus checks if the authenticated user is subscribed to a genre
func GetGenreSubscriptionStatus(c *gin.Context) {
	genre := strings.TrimSpace(c.Param("genre"))
	if genre == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre"})
		return
	}

	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))

	isSubscribed, err := repository.IsSubscribedToGenre(userID, genre)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check subscription"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"isSubscribed": isSubscribed})
}

// GetUserGenreSubscriptions returns all genre subscriptions for the authenticated user
func GetUserGenreSubscriptions(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))

	subscriptions, err := repository.GetUserGenreSubscriptions(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch subscriptions"})
		return
	}

	// Ensure empty array instead of null in JSON response
	if subscriptions == nil {
		subscriptions = []models.GenreSubscription{}
	}

	c.JSON(http.StatusOK, subscriptions)
}
