import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { theme } from "../theme";

export default function MagicLinkRequest() {
  const { requestMagicLink } = useAuth();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (!email.trim()) {
      setStatus({ type: "error", message: "Email je obavezan." });
      return;
    }

    try {
      setLoading(true);
      await requestMagicLink({ email: email.trim() });

      setStatus({
        type: "success",
        message:
          "Ako email postoji u sistemu, magic link je poslat. Proveri inbox ili spam.",
      });
      setEmail("");
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Greška pri slanju magic linka.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Prijava putem magic linka</h2>

        <p style={styles.description}>
          Unesi email adresu i poslaćemo ti link za prijavu bez lozinke.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              type="email"
              value={email}
              placeholder="npr. pera@gmail.com"
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              style={styles.input}
            />
          </label>

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Šaljem..." : "Pošalji magic link"}
          </button>

          {status.message && (
            <div
              style={{
                ...styles.message,
                ...(status.type === "success" ? styles.success : styles.error),
              }}
            >
              {status.message}
            </div>
          )}

          <div style={styles.links}>
            <Link to="/login" style={styles.link}>
              Nazad na login
            </Link>
            <Link to="/register" style={styles.link}>
              Registracija
            </Link>
          </div>
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
    background: theme.colors.background,
    padding: theme.spacing.xl,
  },
  card: {
    ...theme.components.card(),
    width: 420,
    maxWidth: "90%",
  },
  title: {
    fontSize: theme.typography.fontSize["2xl"],
    marginBottom: theme.spacing.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  description: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.base,
    marginBottom: theme.spacing.lg,
    lineHeight: 1.5,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.md,
  },
  label: theme.components.label(),
  input: theme.components.input(),
  btn: {
    ...theme.components.button(),
    marginTop: theme.spacing.sm,
  },
  message: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    fontSize: theme.typography.fontSize.base,
  },
  success: {
    background: "#E8F5E9",
    color: theme.colors.semantic.success,
    border: `1px solid ${theme.colors.semantic.success}`,
  },
  error: {
    background: "#FDF5F4",
    color: theme.colors.semantic.error,
    border: `1px solid ${theme.colors.semantic.error}`,
  },
  links: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  link: theme.components.link(),
};
