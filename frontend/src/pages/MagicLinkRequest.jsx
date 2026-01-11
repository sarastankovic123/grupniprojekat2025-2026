import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

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
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>Prijava putem magic linka</h2>

      <p style={{ opacity: 0.8 }}>
        Unesi email adresu i poslaćemo ti link za prijavu bez lozinke.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: 12, marginTop: 16 }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          Email
          <input
            type="email"
            value={email}
            placeholder="npr. pera@gmail.com"
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Šaljem..." : "Pošalji magic link"}
        </button>

        {status.message && (
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              background:
                status.type === "success" ? "#e9f7ef" : "#fdecea",
            }}
          >
            {status.message}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 10,
          }}
        >
          <Link to="/login">Nazad na login</Link>
          <Link to="/register">Registracija</Link>
        </div>
      </form>
    </div>
  );
}
