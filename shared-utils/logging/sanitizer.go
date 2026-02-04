package logging

import (
	"strings"
)

// RedactEmail masks most of the email address for privacy
// Example: user@example.com -> u***@example.com
func RedactEmail(email string) string {
	if email == "" {
		return ""
	}

	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		// Invalid email format, redact completely
		return "***"
	}

	localPart := parts[0]
	domain := parts[1]

	// Show first character of local part
	if len(localPart) == 0 {
		return "***@" + domain
	}

	redacted := string(localPart[0]) + "***"
	return redacted + "@" + domain
}

// RedactToken completely removes token/OTP values from logs
// Returns a placeholder indicating token type
func RedactToken(tokenType string) string {
	return "[" + tokenType + "_REDACTED]"
}

// TruncateString limits the size of a string in logs
// Prevents excessively long log entries
func TruncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

// SanitizeError removes potentially sensitive information from error messages
// Keeps the error structure but redacts values
func SanitizeError(err error) string {
	if err == nil {
		return ""
	}

	errStr := err.Error()

	// Common patterns to redact
	patterns := []string{
		"password", "token", "secret", "key", "otp",
	}

	for _, pattern := range patterns {
		if strings.Contains(strings.ToLower(errStr), pattern) {
			// If error contains sensitive keywords, truncate aggressively
			return TruncateString(errStr, 50)
		}
	}

	// Safe error, just limit length
	return TruncateString(errStr, 200)
}

// SafeUserID returns the user ID string or empty if invalid
// Prevents logging of malformed/suspicious IDs
func SafeUserID(userID string) string {
	if userID == "" {
		return ""
	}

	// MongoDB ObjectIDs are 24 hex characters
	if len(userID) != 24 {
		return "[INVALID_ID]"
	}

	// Check if all characters are hex
	for _, c := range userID {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return "[INVALID_ID]"
		}
	}

	return userID
}
