import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { theme } from "../theme";

function isStrongPassword(pw) {
  const minLen = pw.length >= 8;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  return minLen && hasUpper && hasLower && hasDigit && hasSpecial;
}

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const urlToken = useMemo(() => params.get("token") || "", [params]);
  const [manualToken, setManualToken] = useState("");
  const token = useMemo(
    () => urlToken || manualToken.trim(),
    [urlToken, manualToken]
  );

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (!token) {
      setStatus({
        type: "error",
        message:
          "Nedostaje token u linku. Otvori kompletan link iz emaila ili nalepi token ruÄno.",
      });
      return;
    }
    if (!newPassword || !confirm) {
      setStatus({ type: "error", message: "Popuni sva polja." });
      return;
    }
    if (newPassword !== confirm) {
      setStatus({ type: "error", message: "Lozinke se ne poklapaju." });
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setStatus({
        type: "error",
        message:
          "Lozinka mora imati bar 8 karaktera, veliko slovo, malo slovo, broj i specijalni znak.",
      });
      return;
    }

    try {
      setLoading(true);
      await resetPassword({ token, newPassword });

      setStatus({ type: "success", message: "Lozinka je promenjena. Preusmeravam na login..." });
      setTimeout(() => navigate("/login", { replace: true }), 800);
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Link je nevaÅ¾eÄ‡i ili je istekao.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Postavi novu lozinku</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Nova lozinka
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Potvrdi lozinku
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              style={styles.input}
            />
          </label>

        {!urlToken && (
          <label style={{ display: "grid", gap: 6 }}>
            Token iz linka
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Nalepi token ako nije u URL-u"
            />
          </label>
        )}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Menjam..." : "Promeni lozinku"}
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

          <div style={styles.linkContainer}>
            <Link to="/login" style={styles.link}>
              Nazad na login
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
    marginBottom: theme.spacing.lg,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
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
  linkContainer: {
    marginTop: theme.spacing.md,
  },
  link: theme.components.link(),
};
