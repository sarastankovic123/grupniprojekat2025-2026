package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"content-service/config"
	"content-service/repository"
	"shared-utils/httpclient"
	"shared-utils/validation"

	"github.com/gin-gonic/gin"
)

var subscriptionEventsClient = httpclient.NewResilientClient(httpclient.ResilientClientOptions{
	HTTPClient:            httpclient.GetClient(),
	DefaultRequestTimeout: 2 * time.Second,
	Retry:                 httpclient.RetryPolicy{MaxAttempts: 2, BaseBackoff: 100 * time.Millisecond, MaxBackoff: 500 * time.Millisecond},
	BreakerName:           "content-service-subscription-events",
})

type subscriptionAsyncEvent struct {
	Type      string                 `json:"type" binding:"required,min=3,max=100"`
	Source    string                 `json:"source" binding:"omitempty,max=100"`
	Timestamp time.Time              `json:"timestamp"`
	Data      map[string]interface{} `json:"data,omitempty"`
}

func emitSubscriptionEvent(eventType string, data map[string]interface{}) {
	if subscriptionEventsClient == nil || eventType == "" {
		return
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		payload := subscriptionAsyncEvent{
			Type:      eventType,
			Source:    "content-service",
			Timestamp: time.Now().UTC(),
			Data:      data,
		}

		req, err := httpclient.NewJSONRequest(ctx, "POST", config.ContentServiceURL+"/api/internal/subscription-events", payload)
		if err != nil {
			return
		}
		req.Header.Set("X-Service-API-Key", config.ServiceAPIKey)

		resp, err := subscriptionEventsClient.Do(ctx, req)
		if resp != nil && resp.Body != nil {
			_ = resp.Body.Close()
		}
		if err != nil && Logger != nil {
			Logger.Application.Warn().Err(err).Str("event_type", eventType).Msg("Failed to emit subscription async event")
		}
	}()
}

func HandleSubscriptionAsyncEvent(c *gin.Context) {
	var req subscriptionAsyncEvent
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event payload"})
		return
	}

	go processSubscriptionEvent(req)

	if Logger != nil {
		Logger.Application.Info().
			Str("event_type", req.Type).
			Str("source", req.Source).
			Msg("Accepted subscription async event")
	}
	log.Printf("Accepted subscription async event type=%s source=%s", req.Type, req.Source)

	c.JSON(http.StatusAccepted, gin.H{"message": "Subscription event accepted"})
}

func processSubscriptionEvent(req subscriptionAsyncEvent) {
	switch req.Type {
	case "artist.created":
		handleArtistCreatedForSubscribers(req.Data)
	case "song.created":
		handleSongCreatedForSubscribers(req.Data)
	default:
		if Logger != nil {
			Logger.Application.Debug().Str("event_type", req.Type).Msg("Ignoring unsupported subscription event")
		}
	}
}

func handleArtistCreatedForSubscribers(data map[string]interface{}) {
	artistName, ok := getStringField(data, "name")
	if !ok || artistName == "" {
		return
	}

	genres := getStringSliceField(data, "genres")
	if len(genres) == 0 {
		return
	}

	subscriberMap := make(map[string]bool)
	for _, genre := range genres {
		genreSubs, err := repository.GetGenreSubscribers(genre)
		if err != nil {
			continue
		}
		for _, userID := range genreSubs {
			subscriberMap[userID.Hex()] = true
		}
	}

	message := fmt.Sprintf("New artist added: %s", validation.SanitizeForHTML(artistName))
	for userIDHex := range subscriberMap {
		sendNotification(userIDHex, message)
	}
}

func handleSongCreatedForSubscribers(data map[string]interface{}) {
	songID, ok := getStringField(data, "songId")
	if !ok || songID == "" {
		return
	}

	song, err := repository.GetSongByID(songID)
	if err != nil || song == nil {
		return
	}

	album, err := repository.GetAlbumByID(song.AlbumID.Hex())
	if err != nil || album == nil {
		return
	}

	artist, err := repository.GetArtistByID(album.ArtistID.Hex())
	if err != nil || artist == nil {
		return
	}

	subscriberMap := make(map[string]bool)

	artistSubs, err := repository.GetArtistSubscribers(album.ArtistID)
	if err == nil {
		for _, userID := range artistSubs {
			subscriberMap[userID.Hex()] = true
		}
	}

	allGenres := append(album.Genres, artist.Genres...)
	for _, genre := range allGenres {
		genreSubs, err := repository.GetGenreSubscribers(genre)
		if err != nil {
			continue
		}
		for _, userID := range genreSubs {
			subscriberMap[userID.Hex()] = true
		}
	}

	message := fmt.Sprintf(
		"New song: %s by %s",
		validation.SanitizeForHTML(song.Title),
		validation.SanitizeForHTML(artist.Name),
	)
	for userIDHex := range subscriberMap {
		sendNotification(userIDHex, message)
	}
}

func getStringField(data map[string]interface{}, key string) (string, bool) {
	if data == nil {
		return "", false
	}
	raw, ok := data[key]
	if !ok {
		return "", false
	}
	val, ok := raw.(string)
	return val, ok
}

func getStringSliceField(data map[string]interface{}, key string) []string {
	if data == nil {
		return nil
	}

	raw, ok := data[key]
	if !ok {
		return nil
	}

	switch v := raw.(type) {
	case []string:
		return v
	case []interface{}:
		out := make([]string, 0, len(v))
		for _, item := range v {
			str, ok := item.(string)
			if ok && str != "" {
				out = append(out, str)
			}
		}
		return out
	default:
		return nil
	}
}
