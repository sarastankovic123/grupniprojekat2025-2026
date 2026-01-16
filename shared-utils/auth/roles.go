package auth

import "strings"

const (
	RoleAdmin = "ADMIN"
	RoleUser  = "USER"
)

// NormalizeRole maps legacy/internal role strings to the roles used by the spec/UI.
// Supported:
// - "ADMIN", "A", "administrator", "admin" => "ADMIN"
// - "USER", "U", "RK"                      => "USER"
func NormalizeRole(role string) string {
	r := strings.TrimSpace(strings.ToUpper(role))
	switch r {
	case "ADMIN", "A", "ADMINISTRATOR":
		return RoleAdmin
	case "USER", "U", "RK", "REGULAR", "REGULAR_USER":
		return RoleUser
	default:
		// Unknown/custom role - keep as-is (uppercased) so callers can still compare deterministically.
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

