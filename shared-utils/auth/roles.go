package auth

import "strings"

const (
	RoleAdmin   = "A"
	RoleRegular = "RK"
)

// NormalizeRole maps legacy/internal role strings to the roles used by the spec/UI.
// Supported:
// - "ADMIN", "A"   => "A"
// - "USER", "RK"   => "RK"
func NormalizeRole(role string) string {
	r := strings.TrimSpace(strings.ToUpper(role))
	switch r {
	case "A", "ADMIN":
		return RoleAdmin
	case "RK", "USER":
		return RoleRegular
	default:
		// Unknown/custom role - keep as-is (uppercased) so callers can still compare deterministically.
		return r
	}
}

func IsAdmin(role string) bool {
	return NormalizeRole(role) == RoleAdmin
}

func IsRegular(role string) bool {
	return NormalizeRole(role) == RoleRegular
}

func RoleMatches(requiredRole string, actualRole string) bool {
	return NormalizeRole(requiredRole) == NormalizeRole(actualRole)
}

