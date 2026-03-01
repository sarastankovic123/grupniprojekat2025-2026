package validation

import (
	"fmt"
	"html"
	"regexp"
	"strings"
	"unicode"
)

const (
	UsernameMinLength  = 3
	UsernameMaxLength  = 50
	EmailMinLength     = 5
	EmailMaxLength     = 255
	FirstNameMinLength = 1
	FirstNameMaxLength = 100
	LastNameMinLength  = 1
	LastNameMaxLength  = 100
	PasswordMinLength  = 8
	PasswordMaxLength  = 128

	ArtistNameMinLength = 1
	ArtistNameMaxLength = 200
	BiographyMaxLength  = 5000
	AlbumTitleMinLength = 1
	AlbumTitleMaxLength = 200
	SongTitleMinLength  = 1
	SongTitleMaxLength  = 200
	GenreMinLength      = 1
	GenreMaxLength      = 50
	GenresMaxCount      = 10

	SongDurationMin = 1    // 1 second
	SongDurationMax = 7200 // 2 hours in seconds

	NotificationMessageMinLength = 1
	NotificationMessageMaxLength = 1000
)

var (
	UsernamePattern = regexp.MustCompile(`^[a-zA-Z0-9_]+$`)
	DatePattern     = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
	ObjectIDPattern = regexp.MustCompile(`^[a-fA-F0-9]{24}$`)
)

func ValidateStringLength(s string, min, max int, fieldName string) error {
	length := len(s)
	if length < min {
		return fmt.Errorf("%s must be at least %d characters long", fieldName, min)
	}
	if length > max {
		return fmt.Errorf("%s must not exceed %d characters", fieldName, max)
	}
	return nil
}

func ValidateAlphanumericUnderscore(s string, fieldName string) error {
	if !UsernamePattern.MatchString(s) {
		return fmt.Errorf("%s can only contain letters, numbers, and underscores", fieldName)
	}
	return nil
}

func ValidateNoControlCharacters(s string, fieldName string) error {
	for _, r := range s {
		if unicode.IsControl(r) && r != '\n' && r != '\r' && r != '\t' {
			return fmt.Errorf("%s contains invalid control characters", fieldName)
		}
	}
	return nil
}

func TrimAndValidateNonEmpty(s string, fieldName string) (string, error) {
	trimmed := strings.TrimSpace(s)
	if trimmed == "" {
		return "", fmt.Errorf("%s is required", fieldName)
	}
	return trimmed, nil
}

func ValidateIntRange(n int, min, max int, fieldName string) error {
	if n < min || n > max {
		return fmt.Errorf("%s must be between %d and %d", fieldName, min, max)
	}
	return nil
}

func ValidateArraySize(arr []string, min, max int, fieldName string) error {
	size := len(arr)
	if size < min || size > max {
		return fmt.Errorf("%s must contain between %d and %d items", fieldName, min, max)
	}
	return nil
}

func ValidateArrayItems(arr []string, minLen, maxLen int, fieldName string) error {
	for i, item := range arr {
		trimmed := strings.TrimSpace(item)
		if trimmed == "" {
			return fmt.Errorf("%s[%d] cannot be empty", fieldName, i)
		}
		if err := ValidateStringLength(trimmed, minLen, maxLen, fmt.Sprintf("%s[%d]", fieldName, i)); err != nil {
			return err
		}
	}
	return nil
}

func ValidateDateFormat(date string, fieldName string) error {
	if date == "" {
		return nil // Allow empty dates if optional
	}

	if !DatePattern.MatchString(date) {
		return fmt.Errorf("%s must be in YYYY-MM-DD format", fieldName)
	}

	var year, month, day int
	_, err := fmt.Sscanf(date, "%d-%d-%d", &year, &month, &day)
	if err != nil {
		return fmt.Errorf("%s has invalid date format", fieldName)
	}

	if year < 1900 || year > 2100 {
		return fmt.Errorf("%s year must be between 1900 and 2100", fieldName)
	}
	if month < 1 || month > 12 {
		return fmt.Errorf("%s month must be between 1 and 12", fieldName)
	}
	if day < 1 || day > 31 {
		return fmt.Errorf("%s day must be between 1 and 31", fieldName)
	}

	return nil
}

func ValidateObjectIDFormat(id string, fieldName string) error {
	if !ObjectIDPattern.MatchString(id) {
		return fmt.Errorf("%s must be a valid 24-character hexadecimal string", fieldName)
	}
	return nil
}

func SanitizeForHTML(s string) string {
	return html.EscapeString(s)
}

func StripControlCharacters(s string) string {
	return strings.Map(func(r rune) rune {
		if unicode.IsControl(r) && r != '\n' && r != '\r' && r != '\t' {
			return -1 // Remove character
		}
		return r
	}, s)
}
