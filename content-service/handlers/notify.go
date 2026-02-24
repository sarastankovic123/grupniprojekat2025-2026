package handlers

import (
	"context"
	"time"

	"content-service/config"
	"shared-utils/httpclient"
)

var notificationsClient = httpclient.NewResilientClient(httpclient.ResilientClientOptions{
	HTTPClient:            httpclient.GetClient(),
	DefaultRequestTimeout: 2 * time.Second,
	Retry:                 httpclient.RetryPolicy{MaxAttempts: 3, BaseBackoff: 100 * time.Millisecond, MaxBackoff: 500 * time.Millisecond},
	BreakerName:           "notification-service",
})

// sendNotification sends a notification to a user via the notification service
func sendNotification(userID, message string) {
	if notificationsClient == nil {
		return
	}

	payload := map[string]string{
		"userId":  userID,
		"message": message,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	req, err := httpclient.NewJSONRequest(ctx, "POST", config.NotificationsServiceURL+"/api/notifications", payload)
	if err != nil {
		return
	}
	req.Header.Set("X-Service-API-Key", config.ServiceAPIKey)
	resp, err := notificationsClient.Do(ctx, req)
	if resp != nil && resp.Body != nil {
		_ = resp.Body.Close()
	}
	if err != nil && Logger != nil {
		Logger.Application.Warn().Err(err).Msg("Failed to send notification (content-service)")
	}
}
