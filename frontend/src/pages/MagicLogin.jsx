import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

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
        setStatus({ type: "success", message: "Uspešna prijava. Preusmeravam..." });
        navigate("/", { replace: true });
      } catch (err) {
        setStatus({
          type: "error",
          message: err.message || "Magic link je nevažeći ili je istekao.",
        });
      }
    })();
  }, [params, consumeMagicLink, navigate]);

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>Magic login</h2>

      <div
        style={{
          padding: 12,
          borderRadius: 8,
          background:
            status.type === "success"
              ? "#e9f7ef"
              : status.type === "error"
              ? "#fdecea"
              : "#eef2ff",
        }}
      >
        {status.message}
      </div>

      {status.type === "error" && (
        <div style={{ marginTop: 12 }}>
          <Link to="/recover">Pošalji novi magic link</Link>
        </div>
      )}
    </div>
  );
}
