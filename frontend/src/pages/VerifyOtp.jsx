import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { theme } from "../theme";

export default function VerifyOtp() {
  const nav = useNavigate();
  const loc = useLocation();
  const { verifyOtp } = useAuth();

  const loginState = loc.state || {};
  const emailFromState = loginState.email || "";
  const sessionIdFromState = loginState.sessionId || loginState.sessionID || loginState.sid || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const payloadHint = useMemo(() => {

    return sessionIdFromState ? "Using sessionId + otp" : "Using email + otp";
  }, [sessionIdFromState]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const payload = sessionIdFromState
        ? { sessionId: sessionIdFromState, otp }
        : { email: emailFromState, otp };

      await verifyOtp(payload);

      nav("/artists", { replace: true });
    } catch (e) {
      setErr(e.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2>Verify OTP</h2>
        <div style={styles.meta}>
          <div><b>Email:</b> {emailFromState || "(missing - go back to login)"}</div>
          <div><b>Mode:</b> {payloadHint}</div>
        </div>

        <form onSubmit={onSubmit} style={styles.form}>
          <label style={styles.label}>
            OTP code
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              style={styles.input}
            />
          </label>

          {err ? <div style={styles.error}>{err}</div> : null}

          <button disabled={loading} style={styles.btn}>
            {loading ? "Verifying..." : "Verify"}
          </button>

          <button
            type="button"
            onClick={() => nav("/login", { state: { email: emailFromState } })}
            style={{ ...styles.btn, ...styles.btnSecondary }}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: theme.spacing.xl,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: theme.colors.background,
  },
  card: {
    ...theme.components.card(),
    width: 460,
    maxWidth: "90%",
  },
  meta: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    display: "grid",
    gap: theme.spacing.xs,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  label: theme.components.label(),
  input: theme.components.input(),
  btn: theme.components.button(),
  btnSecondary: theme.components.button("secondary"),
  error: {
    color: theme.colors.semantic.error,
    padding: theme.spacing.md,
    background: "#FDF5F4",
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.semantic.error}`,
  },
};
