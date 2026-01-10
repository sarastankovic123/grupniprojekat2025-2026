package middleware

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type RateLimiter struct {
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	rateVal  rate.Limit
	burst    int
	window   time.Duration
}

func NewRateLimiter(requests int, window time.Duration) *RateLimiter {
	// Calculate rate per second
	reqPerSecond := float64(requests) / window.Seconds()

	rl := &RateLimiter{
		limiters: make(map[string]*rate.Limiter),
		rateVal:  rate.Limit(reqPerSecond),
		burst:    requests,
		window:   window,
	}

	// Start cleanup goroutine
	go rl.cleanupStale()

	return rl
}

func (rl *RateLimiter) getLimiter(key string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	limiter, exists := rl.limiters[key]
	if !exists {
		limiter = rate.NewLimiter(rl.rateVal, rl.burst)
		rl.limiters[key] = limiter
	}

	return limiter
}

func (rl *RateLimiter) cleanupStale() {
	ticker := time.NewTicker(1 * time.Hour)
	for range ticker.C {
		rl.mu.Lock()
		// Reset all limiters periodically to prevent memory leaks
		rl.limiters = make(map[string]*rate.Limiter)
		rl.mu.Unlock()
	}
}

// RateLimitByIP limits requests based on client IP address
func (rl *RateLimiter) RateLimitByIP() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiter := rl.getLimiter(ip)

		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Rate limit exceeded. Please try again later.",
				"retry_after": fmt.Sprintf("%v", rl.window),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RateLimitByUser limits requests based on authenticated user ID, falls back to IP
func (rl *RateLimiter) RateLimitByUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Try to get user ID from context (set by auth middleware)
		key := c.ClientIP() // Default to IP
		if userID, exists := c.Get("userID"); exists {
			if userIDStr, ok := userID.(string); ok {
				key = "user:" + userIDStr
			}
		}

		limiter := rl.getLimiter(key)

		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Rate limit exceeded. Please try again later.",
				"retry_after": fmt.Sprintf("%v", rl.window),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
