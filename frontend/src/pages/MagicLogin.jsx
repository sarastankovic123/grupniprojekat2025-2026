import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { theme } from "../theme";

export default function MagicLogin() {
  const { consumeMagicLink } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState({ type: "info", message: "Verifikujem link..." });

  useEffect(() => {
    const token =
      params.get("token") ||
      new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token");

    if (!token) {
      setStatus({ type: "error", message: "Nedostaje token u linku." });
      return;
    }

    (async () => {
      try {
        const consumedKey = `magicLinkConsumed:${token}`;
        if (sessionStorage.getItem(consumedKey) === "1") {
          navigate("/", { replace: true });
          return;
        }

        await consumeMagicLink(token);
        sessionStorage.setItem(consumedKey, "1");
        setStatus({ type: "success", message: "UspeÅ¡na prijava. Preusmeravam..." });
        navigate("/", { replace: true });
      } catch (err) {
        setStatus({
          type: "error",
          message: err.message || "Magic link je nevaÅ¾eÄ‡i ili je istekao.",
        });
      }
    })();
  }, [params, consumeMagicLink, navigate]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Magic login</h2>

        <div
          style={{
            ...styles.message,
            ...(status.type === "success"
              ? styles.success
              : status.type === "error"
              ? styles.error
              : styles.info),
          }}
        >
          {status.message}
        </div>

        {status.type === "error" && (
          <div style={styles.linkContainer}>
            <Link to="/recover" style={styles.link}>
              PoÅ¡alji novi magic link
            </Link>
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
    width: 420,
    maxWidth: "90%",
  },
  title: {
    fontSize: theme.typography.fontSize["2xl"],
    marginBottom: theme.spacing.lg,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
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
  info: {
    background: "#E3F2FD",
    color: theme.colors.semantic.info,
    border: `1px solid ${theme.colors.semantic.info}`,
  },
  linkContainer: {
    marginTop: theme.spacing.md,
  },
  link: theme.components.link(),
};
