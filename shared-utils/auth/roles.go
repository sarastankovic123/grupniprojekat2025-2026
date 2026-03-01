package auth

import "strings"

const (
	RoleAdmin = "ADMIN"
	RoleUser  = "USER"
)

func NormalizeRole(role string) string {
	r := strings.TrimSpace(strings.ToUpper(role))
	switch r {
	case "ADMIN", "A", "ADMINISTRATOR":
		return RoleAdmin
	case "USER", "U", "RK", "REGULAR", "REGULAR_USER":
		return RoleUser
	default:
		return r
	}
}

func IsAdmin(role string) bool {
	return NormalizeRole(role) == RoleAdmin
}

func IsUser(role string) bool {
	return NormalizeRole(role) == RoleUser
}

func RoleMatches(requiredRole string, actualRole string) bool {
	return NormalizeRole(requiredRole) == NormalizeRole(actualRole)
}

