import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";
import { theme } from "../theme";

export default function Confirm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [status, setStatus] = useState("confirming");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    apiFetch(`/api/auth/confirm?token=${encodeURIComponent(token)}`, {
      method: "GET",
    })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {status === "confirming" && (
          <div style={styles.message}>
            <div style={styles.spinner}>⏳</div>
            <p>Confirming account...</p>
          </div>
        )}
        {status === "success" && (
          <div style={styles.success}>
            <h2 style={styles.title}>Account confirmed ✅</h2>
            <p style={styles.text}>Your account has been successfully confirmed!</p>
            <button onClick={() => navigate("/login")} style={styles.btn}>
              Go to login
            </button>
          </div>
        )}
        {status === "error" && (
          <div style={styles.error}>
            <h2 style={styles.title}>Confirmation failed ❌</h2>
            <p style={styles.text}>
              The confirmation link is invalid or has expired. Please try registering again.
            </p>
          </div>
        )}
        {status === "invalid" && (
          <div style={styles.error}>
            <h2 style={styles.title}>Invalid confirmation link ❌</h2>
            <p style={styles.text}>The confirmation link is missing or malformed.</p>
          </div>
        )}
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
    width: 480,
    maxWidth: "90%",
    textAlign: "center",
  },
  message: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing.md,
    color: theme.colors.text.secondary,
  },
  spinner: {
    fontSize: 48,
    animation: "spin 2s linear infinite",
  },
  success: {
    color: theme.colors.semantic.success,
  },
  error: {
    color: theme.colors.semantic.error,
  },
  title: {
    fontSize: theme.typography.fontSize["2xl"],
    marginBottom: theme.spacing.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  text: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  btn: {
    ...theme.components.button(),
    marginTop: theme.spacing.md,
  },
};
