import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";

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
    <div style={{ padding: 40 }}>
      {status === "confirming" && <p>Confirming account...</p>}
      {status === "success" && (
        <>
          <h2>Account confirmed ✅</h2>
          <button onClick={() => navigate("/login")}>Go to login</button>
        </>
      )}
      {status === "error" && <p>Confirmation failed ❌</p>}
      {status === "invalid" && <p>Invalid confirmation link ❌</p>}
    </div>
  );
}
