package httpclient

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"math/rand/v2"
	"net/http"
	"time"

	"github.com/sony/gobreaker"
)

type RetryPolicy struct {
	MaxAttempts int
	BaseBackoff time.Duration
	MaxBackoff  time.Duration
}

type ResilientClientOptions struct {
	HTTPClient *http.Client

	// DefaultRequestTimeout is applied only if ctx has no deadline.
	DefaultRequestTimeout time.Duration

	Retry RetryPolicy

	// BreakerName is used for metrics/logging. If empty, circuit breaker is disabled.
	BreakerName string
}

type ResilientClient struct {
	httpClient *http.Client
	breaker    *gobreaker.CircuitBreaker

	defaultRequestTimeout time.Duration
	retry                 RetryPolicy
}

func NewResilientClient(opts ResilientClientOptions) *ResilientClient {
	httpClient := opts.HTTPClient
	if httpClient == nil {
		httpClient = GetClient()
	}

	var breaker *gobreaker.CircuitBreaker
	if opts.BreakerName != "" {
		breaker = gobreaker.NewCircuitBreaker(gobreaker.Settings{
			Name:        opts.BreakerName,
			MaxRequests: 1,
			Interval:    30 * time.Second,
			Timeout:     15 * time.Second,
			ReadyToTrip: func(counts gobreaker.Counts) bool {
				// Trip after a short burst of consecutive failures to avoid piling on a down upstream.
				return counts.ConsecutiveFailures >= 3
			},
		})
	}

	retry := opts.Retry
	if retry.MaxAttempts <= 0 {
		retry.MaxAttempts = 1
	}
	if retry.BaseBackoff <= 0 {
		retry.BaseBackoff = 100 * time.Millisecond
	}
	if retry.MaxBackoff <= 0 {
		retry.MaxBackoff = 1 * time.Second
	}

	return &ResilientClient{
		httpClient:            httpClient,
		breaker:               breaker,
		defaultRequestTimeout: opts.DefaultRequestTimeout,
		retry:                 retry,
	}
}

func NewJSONRequest(ctx context.Context, method, url string, payload any) (*http.Request, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	r := bytes.NewReader(body)
	req, err := http.NewRequestWithContext(ctx, method, url, r)
	if err != nil {
		return nil, err
	}

	req.GetBody = func() (io.ReadCloser, error) {
		return io.NopCloser(bytes.NewReader(body)), nil
	}
	req.Header.Set("Content-Type", "application/json")
	return req, nil
}

func (c *ResilientClient) Do(ctx context.Context, req *http.Request) (*http.Response, error) {
	if ctx == nil {
		ctx = context.Background()
	}

	ctx, cancel := c.applyDefaultTimeout(ctx)
	if cancel != nil {
		defer cancel()
	}

	var lastErr error
	for attempt := 1; attempt <= c.retry.MaxAttempts; attempt++ {
		if err := ctx.Err(); err != nil {
			return nil, err
		}

		attemptReq, err := cloneRequestWithContext(req, ctx)
		if err != nil {
			return nil, err
		}

		resp, err := c.doOnce(attemptReq)
		if err == nil && resp != nil && !isRetryableStatus(resp.StatusCode) {
			return resp, nil
		}

		if resp != nil && resp.Body != nil {
			_ = resp.Body.Close()
		}

		if err == nil && resp != nil && isRetryableStatus(resp.StatusCode) {
			err = errors.New(resp.Status)
		}
		lastErr = err

		if attempt == c.retry.MaxAttempts || !isRetryableError(err) {
			break
		}

		if !sleepWithContext(ctx, backoffDelay(attempt, c.retry.BaseBackoff, c.retry.MaxBackoff)) {
			return nil, ctx.Err()
		}
	}

	return nil, lastErr
}

func (c *ResilientClient) doOnce(req *http.Request) (*http.Response, error) {
	if c.breaker == nil {
		return c.httpClient.Do(req)
	}

	type result struct {
		resp *http.Response
		err  error
	}

	val, err := c.breaker.Execute(func() (any, error) {
		resp, err := c.httpClient.Do(req)
		if err != nil {
			return result{resp: resp, err: err}, err
		}
		if resp != nil && isBreakerFailureStatus(resp.StatusCode) {
			return result{resp: resp, err: errors.New(resp.Status)}, errors.New(resp.Status)
		}
		return result{resp: resp, err: nil}, nil
	})
	if err != nil {
		if errors.Is(err, gobreaker.ErrOpenState) || errors.Is(err, gobreaker.ErrTooManyRequests) {
			return nil, err
		}
		// Return the original response if we have it.
		if r, ok := val.(result); ok && r.resp != nil {
			return r.resp, r.err
		}
		return nil, err
	}

	r, ok := val.(result)
	if !ok {
		return nil, errors.New("unexpected circuit breaker result")
	}
	return r.resp, r.err
}

func (c *ResilientClient) applyDefaultTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	if c.defaultRequestTimeout <= 0 {
		return ctx, nil
	}
	if _, hasDeadline := ctx.Deadline(); hasDeadline {
		return ctx, nil
	}
	return context.WithTimeout(ctx, c.defaultRequestTimeout)
}

func cloneRequestWithContext(req *http.Request, ctx context.Context) (*http.Request, error) {
	if req == nil {
		return nil, errors.New("nil request")
	}
	clone := req.Clone(ctx)
	if req.Body == nil {
		return clone, nil
	}
	if req.GetBody == nil {
		return nil, errors.New("request body is not replayable; set req.GetBody for retries")
	}
	rc, err := req.GetBody()
	if err != nil {
		return nil, err
	}
	clone.Body = rc
	return clone, nil
}

func isRetryableStatus(code int) bool {
	return code == http.StatusTooManyRequests || (code >= 500 && code <= 599)
}

func isBreakerFailureStatus(code int) bool {
	// Count 5xx as failures for breaker purposes.
	return code >= 500 && code <= 599
}

func isRetryableError(err error) bool {
	if err == nil {
		return false
	}
	// Treat context cancellation/timeouts as terminal.
	return !errors.Is(err, context.Canceled) && !errors.Is(err, context.DeadlineExceeded)
}

func backoffDelay(attempt int, base, max time.Duration) time.Duration {
	if attempt <= 1 {
		return 0
	}
	delay := base * time.Duration(1<<(attempt-2))
	if delay > max {
		delay = max
	}
	// Small jitter to avoid thundering herd.
	jitter := time.Duration(rand.IntN(100)) * time.Millisecond
	return delay + jitter
}

func sleepWithContext(ctx context.Context, d time.Duration) bool {
	if d <= 0 {
		return true
	}
	t := time.NewTimer(d)
	defer t.Stop()
	select {
	case <-t.C:
		return true
	case <-ctx.Done():
		return false
	}
}
