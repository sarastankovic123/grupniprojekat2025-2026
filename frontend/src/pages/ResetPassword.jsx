import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

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

  const token = useMemo(() => params.get("token") || "", [params]);

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (!token) {
      setStatus({ type: "error", message: "Nedostaje token u linku." });
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
        message: err.message || "Link je nevažeći ili je istekao.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>Postavi novu lozinku</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Nova lozinka
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Potvrdi lozinku
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Menjam..." : "Promeni lozinku"}
        </button>

        {status.message && (
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              background: status.type === "success" ? "#e9f7ef" : "#fdecea",
            }}
          >
            {status.message}
          </div>
        )}

        <div style={{ marginTop: 10 }}>
          <Link to="/login">Nazad na login</Link>
        </div>
      </form>
    </div>
  );
}
