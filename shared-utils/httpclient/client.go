package httpclient

import (
	"crypto/tls"
	"net"
	"net/http"
	"time"
)

var (
	// InsecureClient is an HTTP client that skips TLS verification
	// Use only for local development with self-signed certificates
	InsecureClient *http.Client
)

func init() {
	InsecureClient = &http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			DialContext: (&net.Dialer{
				Timeout:   5 * time.Second,
				KeepAlive: 30 * time.Second,
			}).DialContext,
			ForceAttemptHTTP2:     true,
			MaxIdleConns:          100,
			IdleConnTimeout:       90 * time.Second,
			TLSHandshakeTimeout:   5 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true, // Skip TLS verification for self-signed certs
			},
		},
	}
}

// GetClient returns the appropriate HTTP client based on environment
// For local development with self-signed certificates, use the insecure client
func GetClient() *http.Client {
	// In production, you should use http.DefaultClient or a client with proper cert validation
	// For now, always use InsecureClient for local development
	return InsecureClient
}
