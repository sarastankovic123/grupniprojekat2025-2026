import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

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
  page: { padding: 24, display: "flex", justifyContent: "center" },
  card: { width: 460, border: "1px solid #ddd", borderRadius: 12, padding: 16 },
  meta: { fontSize: 13, opacity: 0.85, marginBottom: 12, display: "grid", gap: 6 },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  label: { display: "flex", flexDirection: "column", gap: 6 },
  input: { padding: 10, borderRadius: 10, border: "1px solid #ccc" },
  btn: { padding: 10, borderRadius: 10, border: "1px solid #111", cursor: "pointer" },
  btnSecondary: { background: "#fff" },
  error: { color: "crimson" },
};
