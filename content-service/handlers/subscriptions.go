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

	emitRecommendationEvent("artist.subscription.created", map[string]interface{}{
		"userId":   userID.Hex(),
		"artistId": artistObjID.Hex(),
	})

	c.JSON(http.StatusOK, subscription)
}

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

	emitRecommendationEvent("artist.subscription.deleted", map[string]interface{}{
		"userId":   userID.Hex(),
		"artistId": artistObjID.Hex(),
	})

	c.JSON(http.StatusOK, gin.H{"message": "Unsubscribed successfully"})
}

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

	if subscriptions == nil {
		subscriptions = []models.ArtistSubscriptionDetail{}
	}

	c.JSON(http.StatusOK, subscriptions)
}


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

	emitRecommendationEvent("genre.subscription.created", map[string]interface{}{
		"userId": userID.Hex(),
		"genre":  genre,
	})

	c.JSON(http.StatusOK, subscription)
}

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

	emitRecommendationEvent("genre.subscription.deleted", map[string]interface{}{
		"userId": userID.Hex(),
		"genre":  genre,
	})

	c.JSON(http.StatusOK, gin.H{"message": "Unsubscribed successfully"})
}

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

	if subscriptions == nil {
		subscriptions = []models.GenreSubscription{}
	}

	c.JSON(http.StatusOK, subscriptions)
}
