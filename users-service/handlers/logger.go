package handlers

import (
	"time"

	"shared-utils/httpclient"
	"shared-utils/logging"
)

// Logger is the package-level logger instance
// Set by main.go during service initialization
var Logger *logging.Logger
var NotificationsClient *httpclient.ResilientClient

// SetLogger sets the package-level logger
func SetLogger(l *logging.Logger) {
	Logger = l
	NotificationsClient = httpclient.NewResilientClient(httpclient.ResilientClientOptions{
		HTTPClient:            httpclient.GetClient(),
		DefaultRequestTimeout: 2 * time.Second,
		Retry:                 httpclient.RetryPolicy{MaxAttempts: 3, BaseBackoff: 100 * time.Millisecond, MaxBackoff: 500 * time.Millisecond},
		BreakerName:           "notification-service",
	})
}
