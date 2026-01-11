import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  // ✅ DODATO
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const normalized = useMemo(() => {
    return {
      email: email.trim(),
      username: username.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      password: password,
      confirmPassword: confirmPassword,
    };
  }, [email, username, firstName, lastName, password, confirmPassword]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setError("");

    const { email, username, firstName, lastName, password, confirmPassword } =
      normalized;

    if (!email || !username || !firstName || !lastName || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          username,
          firstName, // ✅ DODATO
          lastName,  // ✅ DODATO
          password,
          confirmPassword,
        }),
      });

      // Ako imate confirm email flow:
      navigate("/confirm");
      // ili ako želite direktno:
      // navigate("/login");
    } catch (err) {
      setError(err?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Register</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@gmail.com"
            style={styles.input}
            autoComplete="email"
          />

          {/* ✅ DODATO */}
          <label>First name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Marko"
            style={styles.input}
            autoComplete="given-name"
          />

          {/* ✅ DODATO */}
          <label>Last name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Marković"
            style={styles.input}
            autoComplete="family-name"
          />

          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            style={styles.input}
            autoComplete="username"
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={styles.input}
            autoComplete="new-password"
          />

          <label>Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            style={styles.input}
            autoComplete="new-password"
          />

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.primaryBtn}>
            {loading ? "Creating..." : "Create account"}
          </button>

          <Link to="/login" style={styles.secondaryBtn}>
            Go to Login
          </Link>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
    padding: 24,
  },
  card: {
    width: 420,
    background: "white",
    padding: 24,
    borderRadius: 12,
    border: "1px solid #ddd",
  },
  title: {
    fontSize: 32,
    marginBottom: 16,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  input: {
    height: 42,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid #ccc",
    outline: "none",
  },
  error: {
    color: "#b00020",
    background: "#ffecec",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ffb3b3",
  },
  primaryBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 10,
    border: "1px solid #111",
    background: "#eee",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryBtn: {
    marginTop: 8,
    height: 44,
    borderRadius: 10,
    border: "1px solid #111",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    color: "black",
    fontWeight: 600,
  },
};
