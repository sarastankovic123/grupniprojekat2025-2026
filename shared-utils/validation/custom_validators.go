package validation

import (
	"github.com/go-playground/validator/v10"
)

// AlphanumericUnderscoreValidator validates alphanumeric + underscore pattern
// Used for usernames
func AlphanumericUnderscoreValidator(fl validator.FieldLevel) bool {
	value := fl.Field().String()
	return UsernamePattern.MatchString(value)
}

// DateFormatValidator validates YYYY-MM-DD date format
// Used for release dates and other date fields
func DateFormatValidator(fl validator.FieldLevel) bool {
	value := fl.Field().String()
	// Allow empty dates if field is optional (omitempty tag)
	if value == "" {
		return true
	}
	return ValidateDateFormat(value, fl.FieldName()) == nil
}

// RegisterCustomValidators registers all custom validators with the validator instance
func RegisterCustomValidators(v *validator.Validate) error {
	if err := v.RegisterValidation("alphanumund", AlphanumericUnderscoreValidator); err != nil {
		return err
	}
	if err := v.RegisterValidation("dateformat", DateFormatValidator); err != nil {
		return err
	}
	return nil
}
