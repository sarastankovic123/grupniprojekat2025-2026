package handlers

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"net/http"

	"content-service/config"
)

// HTTP client that skips TLS verification for inter-service communication (self-signed certs)
var internalHTTPClient = &http.Client{
	Transport: &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	},
}

// sendNotification sends a notification to a user via the notification service
func sendNotification(userID, message string) {
	notifBody, _ := json.Marshal(map[string]string{
		"userId":  userID,
		"message": message,
	})
	req, err := http.NewRequest(
		"POST",
		config.NotificationsServiceURL+"/api/notifications",
		bytes.NewBuffer(notifBody),
	)
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Service-API-Key", config.ServiceAPIKey)
	internalHTTPClient.Do(req)
}
