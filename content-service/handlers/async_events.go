package handlers

import (
	"context"
	"time"

	"content-service/config"
	"shared-utils/httpclient"
)

var recommendationEventsClient = httpclient.NewResilientClient(httpclient.ResilientClientOptions{
	HTTPClient:            httpclient.GetClient(),
	DefaultRequestTimeout: 2 * time.Second,
	Retry:                 httpclient.RetryPolicy{MaxAttempts: 2, BaseBackoff: 100 * time.Millisecond, MaxBackoff: 500 * time.Millisecond},
	BreakerName:           "recommendation-service-events",
})

type asyncEvent struct {
	Type      string                 `json:"type"`
	Source    string                 `json:"source"`
	Timestamp time.Time              `json:"timestamp"`
	Data      map[string]interface{} `json:"data,omitempty"`
}

func emitRecommendationEvent(eventType string, data map[string]interface{}) {
	if recommendationEventsClient == nil || eventType == "" {
		return
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		payload := asyncEvent{
			Type:      eventType,
			Source:    "content-service",
			Timestamp: time.Now().UTC(),
			Data:      data,
		}

		req, err := httpclient.NewJSONRequest(ctx, "POST", config.RecommendationServiceURL+"/api/internal/events", payload)
		if err != nil {
			return
		}
		req.Header.Set("X-Service-API-Key", config.ServiceAPIKey)

		resp, err := recommendationEventsClient.Do(ctx, req)
		if resp != nil && resp.Body != nil {
			_ = resp.Body.Close()
		}
		if err != nil && Logger != nil {
			Logger.Application.Warn().Err(err).Str("event_type", eventType).Msg("Failed to emit async event")
		}
	}()
}
