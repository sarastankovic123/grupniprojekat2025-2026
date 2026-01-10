package validation

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

// FormatValidationError converts validator errors to user-friendly messages
func FormatValidationError(err error) string {
	if validationErrs, ok := err.(validator.ValidationErrors); ok {
		var messages []string
		for _, e := range validationErrs {
			messages = append(messages, formatFieldError(e))
		}
		return strings.Join(messages, "; ")
	}
	return "Invalid request data"
}

// formatFieldError formats a single validation error into a user-friendly message
func formatFieldError(e validator.FieldError) string {
	field := e.Field()

	switch e.Tag() {
	case "required":
		return fmt.Sprintf("%s is required", field)
	case "email":
		return fmt.Sprintf("%s must be a valid email address", field)
	case "min":
		if e.Type().Kind() == 24 { // String kind
			return fmt.Sprintf("%s must be at least %s characters", field, e.Param())
		}
		return fmt.Sprintf("%s must be at least %s", field, e.Param())
	case "max":
		if e.Type().Kind() == 24 { // String kind
			return fmt.Sprintf("%s must not exceed %s characters", field, e.Param())
		}
		return fmt.Sprintf("%s must not exceed %s", field, e.Param())
	case "alphanumund":
		return fmt.Sprintf("%s can only contain letters, numbers, and underscores", field)
	case "len":
		return fmt.Sprintf("%s must be exactly %s characters", field, e.Param())
	case "hexadecimal":
		return fmt.Sprintf("%s must be a valid hexadecimal string", field)
	case "eqfield":
		return fmt.Sprintf("%s must match %s", field, e.Param())
	case "dateformat":
		return fmt.Sprintf("%s must be in YYYY-MM-DD format", field)
	case "dive":
		return fmt.Sprintf("%s contains invalid items", field)
	default:
		return fmt.Sprintf("%s is invalid", field)
	}
}
