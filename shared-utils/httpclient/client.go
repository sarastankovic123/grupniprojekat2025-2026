package httpclient

import (
	"crypto/tls"
	"net"
	"net/http"
	"time"
)

var (
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

func GetClient() *http.Client {
	return InsecureClient
}
