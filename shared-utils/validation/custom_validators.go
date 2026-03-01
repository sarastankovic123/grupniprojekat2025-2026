package validation

import (
	"github.com/go-playground/validator/v10"
)

func AlphanumericUnderscoreValidator(fl validator.FieldLevel) bool {
	value := fl.Field().String()
	return UsernamePattern.MatchString(value)
}

func DateFormatValidator(fl validator.FieldLevel) bool {
	value := fl.Field().String()
	if value == "" {
		return true
	}
	return ValidateDateFormat(value, fl.FieldName()) == nil
}

func RegisterCustomValidators(v *validator.Validate) error {
	if err := v.RegisterValidation("alphanumund", AlphanumericUnderscoreValidator); err != nil {
		return err
	}
	if err := v.RegisterValidation("dateformat", DateFormatValidator); err != nil {
		return err
	}
	return nil
}
