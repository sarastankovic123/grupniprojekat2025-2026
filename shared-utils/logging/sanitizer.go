package logging

import (
	"strings"
)

func RedactEmail(email string) string {
	if email == "" {
		return ""
	}

	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "***"
	}

	localPart := parts[0]
	domain := parts[1]

	if len(localPart) == 0 {
		return "***@" + domain
	}

	redacted := string(localPart[0]) + "***"
	return redacted + "@" + domain
}

func RedactToken(tokenType string) string {
	return "[" + tokenType + "_REDACTED]"
}

func TruncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

func SanitizeError(err error) string {
	if err == nil {
		return ""
	}

	errStr := err.Error()

	patterns := []string{
		"password", "token", "secret", "key", "otp",
	}

	for _, pattern := range patterns {
		if strings.Contains(strings.ToLower(errStr), pattern) {
			return TruncateString(errStr, 50)
		}
	}

	return TruncateString(errStr, 200)
}

func SafeUserID(userID string) string {
	if userID == "" {
		return ""
	}

	if len(userID) != 24 {
		return "[INVALID_ID]"
	}

	for _, c := range userID {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return "[INVALID_ID]"
		}
	}

	return userID
}
