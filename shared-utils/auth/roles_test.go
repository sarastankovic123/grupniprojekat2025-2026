package auth

import "testing"

func TestNormalizeRole(t *testing.T) {
	cases := []struct {
		in   string
		want string
	}{
		{"ADMIN", RoleAdmin},
		{"A", RoleAdmin},
		{" admin ", RoleAdmin},
		{"USER", RoleRegular},
		{"RK", RoleRegular},
		{" rk ", RoleRegular},
		{"CUSTOM", "CUSTOM"},
		{"", ""},
	}

	for _, tc := range cases {
		if got := NormalizeRole(tc.in); got != tc.want {
			t.Fatalf("NormalizeRole(%q)=%q, want %q", tc.in, got, tc.want)
		}
	}
}

func TestRoleMatches(t *testing.T) {
	if !RoleMatches("ADMIN", "A") {
		t.Fatal("expected ADMIN to match A")
	}
	if !RoleMatches("USER", "RK") {
		t.Fatal("expected USER to match RK")
	}
	if RoleMatches("ADMIN", "RK") {
		t.Fatal("expected ADMIN not to match RK")
	}
}

