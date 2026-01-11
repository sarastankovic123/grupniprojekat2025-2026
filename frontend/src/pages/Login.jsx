import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const { login } = useAuth();

  const initialEmail = loc.state?.email || "";

  const [form, setForm] = useState({
    email: initialEmail,
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await login(form);
      nav("/verify-otp", { state: { ...data, email: form.email } });
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2>Login (OTP)</h2>

        <form onSubmit={onSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              type="email"
              required
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              type="password"
              required
              style={styles.input}
            />
          </label>

          {err ? <div style={styles.error}>{err}</div> : null}

          <button disabled={loading} style={styles.btn}>
            {loading ? "Sending OTP..." : "Login (send OTP)"}
          </button>

          <button
            type="button"
            onClick={() => nav("/register")}
            style={{ ...styles.btn, ...styles.btnSecondary }}
          >
            Create account
          </button>

          <button
            type="button"
            onClick={() => nav("/confirm")}
            style={{ ...styles.btn, ...styles.btnSecondary }}
          >
            Confirm account
          </button>

          {/* LINKOVI - moraju biti unutar return-a */}
          <div style={styles.links}>
            <Link to="/forgot-password" style={styles.link}>
              Zaboravljena lozinka?
            </Link>
            <Link to="/recover" style={styles.link}>
              Prijava preko magic linka
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 24, display: "flex", justifyContent: "center" },
  card: { width: 420, border: "1px solid #ddd", borderRadius: 12, padding: 16 },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  label: { display: "flex", flexDirection: "column", gap: 6 },
  input: { padding: 10, borderRadius: 10, border: "1px solid #ccc" },
  btn: { padding: 10, borderRadius: 10, border: "1px solid #111", cursor: "pointer" },
  btnSecondary: { background: "#fff" },
  error: { color: "crimson" },

  links: { display: "flex", flexDirection: "column", gap: 6, marginTop: 8 },
  link: { textDecoration: "none" },
};
