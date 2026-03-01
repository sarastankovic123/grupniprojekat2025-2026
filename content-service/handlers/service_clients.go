package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"content-service/config"
	"shared-utils/httpclient"
)

var usersClient = httpclient.NewResilientClient(httpclient.ResilientClientOptions{
	HTTPClient:            httpclient.GetClient(),
	DefaultRequestTimeout: 2 * time.Second,
	Retry:                 httpclient.RetryPolicy{MaxAttempts: 2, BaseBackoff: 100 * time.Millisecond, MaxBackoff: 300 * time.Millisecond},
	BreakerName:           "users-service",
})

var recommendationEntityClient = httpclient.NewResilientClient(httpclient.ResilientClientOptions{
	HTTPClient:            httpclient.GetClient(),
	DefaultRequestTimeout: 1200 * time.Millisecond,
	Retry:                 httpclient.RetryPolicy{MaxAttempts: 2, BaseBackoff: 100 * time.Millisecond, MaxBackoff: 300 * time.Millisecond},
	BreakerName:           "recommendation-service-entity-checks",
})

type internalExistsResponse struct {
	Exists bool `json:"exists"`
}

func ensureUserExists(ctx context.Context, userID string) error {
	base := strings.TrimRight(config.UsersServiceURL, "/")
	url := fmt.Sprintf("%s/api/internal/users/%s/exists", base, userID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("X-Service-API-Key", config.ServiceAPIKey)

	resp, err := usersClient.Do(ctx, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return fmt.Errorf("user not found")
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("users-service returned status %d", resp.StatusCode)
	}

	var body internalExistsResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return err
	}
	if !body.Exists {
		return fmt.Errorf("user not found")
	}
	return nil
}

func checkSongExistsViaRecommendation(ctx context.Context, songID string) (bool, error) {
	base := strings.TrimRight(config.RecommendationServiceURL, "/")
	url := fmt.Sprintf("%s/api/internal/songs/%s/exists", base, songID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return false, err
	}
	req.Header.Set("X-Service-API-Key", config.ServiceAPIKey)

	resp, err := recommendationEntityClient.Do(ctx, req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return false, nil
	}
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("recommendation-service returned status %d", resp.StatusCode)
	}

	var body internalExistsResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return false, err
	}
	return body.Exists, nil
}

func checkArtistExistsViaRecommendation(ctx context.Context, artistID string) (bool, error) {
	base := strings.TrimRight(config.RecommendationServiceURL, "/")
	url := fmt.Sprintf("%s/api/internal/artists/%s/exists", base, artistID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return false, err
	}
	req.Header.Set("X-Service-API-Key", config.ServiceAPIKey)

	resp, err := recommendationEntityClient.Do(ctx, req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return false, nil
	}
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("recommendation-service returned status %d", resp.StatusCode)
	}

	var body internalExistsResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return false, err
	}
	return body.Exists, nil
}
