package logging

import (
	"github.com/gin-gonic/gin"
)

// SecurityEventContext holds common fields for security event logging
type SecurityEventContext struct {
	RequestID  string
	UserID     string
	Email      string
	IP         string
	Endpoint   string
	Method     string
	StatusCode int
}

// NewSecurityEventContext creates a SecurityEventContext from Gin context
func NewSecurityEventContext(c *gin.Context) SecurityEventContext {
	return SecurityEventContext{
		RequestID:  GetRequestID(c),
		UserID:     SafeUserID(GetUserIDFromContext(c)),
		Email:      RedactEmail(GetEmailFromContext(c)),
		IP:         GetClientIP(c),
		Endpoint:   c.Request.URL.Path,
		Method:     c.Request.Method,
		StatusCode: c.Writer.Status(),
	}
}

// LogLoginAttempt logs a login attempt (success or failure)
func (l *Logger) LogLoginAttempt(ctx SecurityEventContext, email string, success bool, reason string) {
	event := l.Security.With().
		Str("event_type", "auth_login_attempt").
		Str("request_id", ctx.RequestID).
		Str("email", RedactEmail(email)).
		Str("ip_address", ctx.IP).
		Str("endpoint", ctx.Endpoint).
		Str("method", ctx.Method).
		Int("status_code", ctx.StatusCode).
		Bool("success", success).
		Logger()

	if success {
		event.Info().
			Str("user_id", ctx.UserID).
			Msg("Login successful")
	} else {
		event.Warn().
			Str("reason", reason).
			Msg("Login failed")
	}
}

// LogOTPEvent logs OTP generation, verification, or failure
func (l *Logger) LogOTPEvent(ctx SecurityEventContext, eventType string, success bool, reason string) {
	event := l.Security.With().
		Str("event_type", eventType). // "auth_otp_sent", "auth_otp_verified", "auth_otp_failed"
		Str("request_id", ctx.RequestID).
		Str("user_id", ctx.UserID).
		Str("email", ctx.Email).
		Str("ip_address", ctx.IP).
		Str("endpoint", ctx.Endpoint).
		Str("method", ctx.Method).
		Int("status_code", ctx.StatusCode).
		Bool("success", success).
		Logger()

	if success {
		event.Info().Msg("OTP event: " + eventType)
	} else {
		event.Warn().
			Str("reason", reason).
			Msg("OTP event failed: " + eventType)
	}
}

// LogAuthTokenEvent logs token validation events (invalid, expired, missing)
func (l *Logger) LogAuthTokenEvent(ctx SecurityEventContext, eventType string, reason string) {
	l.Security.Warn().
		Str("event_type", eventType). // "auth_token_invalid", "auth_token_expired", "auth_token_missing"
		Str("request_id", ctx.RequestID).
		Str("ip_address", ctx.IP).
		Str("endpoint", ctx.Endpoint).
		Str("method", ctx.Method).
		Int("status_code", ctx.StatusCode).
		Str("reason", reason).
		Msg("Authentication token error")
}

// LogAuthzFailure logs authorization failures (insufficient permissions)
func (l *Logger) LogAuthzFailure(ctx SecurityEventContext, requiredRole, actualRole string) {
	l.Security.Warn().
		Str("event_type", "authz_forbidden").
		Str("request_id", ctx.RequestID).
		Str("user_id", ctx.UserID).
		Str("email", ctx.Email).
		Str("ip_address", ctx.IP).
		Str("endpoint", ctx.Endpoint).
		Str("method", ctx.Method).
		Int("status_code", ctx.StatusCode).
		Str("required_role", requiredRole).
		Str("actual_role", actualRole).
		Msg("Authorization denied: insufficient permissions")
}

// LogAdminAction logs admin CRUD operations (create, update, delete)
func (l *Logger) LogAdminAction(ctx SecurityEventContext, action, resourceType, resourceID, resourceName string) {
	l.Security.Info().
		Str("event_type", "admin_action").
		Str("request_id", ctx.RequestID).
		Str("user_id", ctx.UserID).
		Str("email", ctx.Email).
		Str("ip_address", ctx.IP).
		Str("endpoint", ctx.Endpoint).
		Str("method", ctx.Method).
		Int("status_code", ctx.StatusCode).
		Str("action", action).              // "create", "update", "delete"
		Str("resource_type", resourceType). // "artist", "album", "song"
		Str("resource_id", resourceID).
		Str("resource_name", TruncateString(resourceName, 100)).
		Msg("Admin action performed")
}

// LogValidationFailure logs input validation errors
func (l *Logger) LogValidationFailure(ctx SecurityEventContext, validationType string, fieldErrors map[string]string) {
	event := l.Security.Warn().
		Str("event_type", "validation_failure").
		Str("request_id", ctx.RequestID).
		Str("user_id", ctx.UserID).
		Str("email", ctx.Email).
		Str("ip_address", ctx.IP).
		Str("endpoint", ctx.Endpoint).
		Str("method", ctx.Method).
		Int("status_code", ctx.StatusCode).
		Str("validation_type", validationType)

	// Add field errors (but don't log actual invalid values for security)
	if len(fieldErrors) > 0 {
		event = event.Interface("field_errors", fieldErrors)
	}

	event.Msg("Input validation failed")
}

// LogRateLimitExceeded logs rate limit violations
func (l *Logger) LogRateLimitExceeded(ctx SecurityEventContext, limit int, window string) {
	l.Security.Warn().
		Str("event_type", "rate_limit_exceeded").
		Str("request_id", ctx.RequestID).
		Str("ip_address", ctx.IP).
		Str("endpoint", ctx.Endpoint).
		Str("method", ctx.Method).
		Int("status_code", 429).
		Int("limit", limit).
		Str("window", window).
		Msg("Rate limit exceeded")
}

// LogUserRegistration logs new user registration
func (l *Logger) LogUserRegistration(ctx SecurityEventContext, userID, email string, success bool, reason string) {
	event := l.Security.With().
		Str("event_type", "user_registration").
		Str("request_id", ctx.RequestID).
		Str("email", RedactEmail(email)).
		Str("ip_address", ctx.IP).
		Str("endpoint", ctx.Endpoint).
		Str("method", ctx.Method).
		Int("status_code", ctx.StatusCode).
		Bool("success", success).
		Logger()

	if success {
		event.Info().
			Str("user_id", SafeUserID(userID)).
			Msg("User registered successfully")
	} else {
		event.Warn().
			Str("reason", reason).
			Msg("User registration failed")
	}
}

// LogEmailConfirmation logs email confirmation attempts
func (l *Logger) LogEmailConfirmation(ctx SecurityEventContext, email string, success bool, reason string) {
	event := l.Security.With().
		Str("event_type", "email_confirmation").
		Str("request_id", ctx.RequestID).
		Str("email", RedactEmail(email)).
		Str("ip_address", ctx.IP).
		Str("endpoint", ctx.Endpoint).
		Str("method", ctx.Method).
		Int("status_code", ctx.StatusCode).
		Bool("success", success).
		Logger()

	if success {
		event.Info().Msg("Email confirmed successfully")
	} else {
		event.Warn().
			Str("reason", reason).
			Msg("Email confirmation failed")
	}
}

// LogPasswordChange logs password change events
func (l *Logger) LogPasswordChange(ctx SecurityEventContext, eventType string, success bool, reason string) {
	event := l.Security.With().
		Str("event_type", eventType). // "password_change" or "password_reset"
		Str("request_id", ctx.RequestID).
		Str("user_id", ctx.UserID).
		Str("email", ctx.Email).
		Str("ip_address", ctx.IP).
		Str("endpoint", ctx.Endpoint).
		Str("method", ctx.Method).
		Int("status_code", ctx.StatusCode).
		Bool("success", success).
		Logger()

	if success {
		event.Info().Msg("Password " + eventType + " successful")
	} else {
		event.Warn().
			Str("reason", reason).
			Msg("Password " + eventType + " failed")
	}
}

// LogMagicLinkEvent logs magic link request and verification
func (l *Logger) LogMagicLinkEvent(ctx SecurityEventContext, eventType string, email string, success bool, reason string) {
	event := l.Security.With().
		Str("event_type", eventType). // "magic_link_request" or "magic_link_verified"
		Str("request_id", ctx.RequestID).
		Str("email", RedactEmail(email)).
		Str("ip_address", ctx.IP).
		Str("endpoint", ctx.Endpoint).
		Str("method", ctx.Method).
		Int("status_code", ctx.StatusCode).
		Bool("success", success).
		Logger()

	if success {
		event.Info().Msg("Magic link " + eventType)
	} else {
		event.Warn().
			Str("reason", reason).
			Msg("Magic link " + eventType + " failed")
	}
}

// LogAccessControlViolation logs when users try to access resources they don't own
func (l *Logger) LogAccessControlViolation(ctx SecurityEventContext, resourceType, resourceID string) {
	l.Security.Warn().
		Str("event_type", "access_control_violation").
		Str("request_id", ctx.RequestID).
		Str("user_id", ctx.UserID).
		Str("email", ctx.Email).
		Str("ip_address", ctx.IP).
		Str("endpoint", ctx.Endpoint).
		Str("method", ctx.Method).
		Int("status_code", 403).
		Str("resource_type", resourceType).
		Str("resource_id", resourceID).
		Msg("User attempted to access resource they don't own")
}
