package utils

import "regexp"

func IsValidEmail(email string) bool {
	re := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	return re.MatchString(email)
}

func IsStrongPassword(p string) bool {
	if len(p) < 8 {
		return false
	}

	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(p)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(p)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(p)
	hasSpecial := regexp.MustCompile(`[^a-zA-Z0-9]`).MatchString(p)

	return hasUpper && hasLower && hasNumber && hasSpecial
}
