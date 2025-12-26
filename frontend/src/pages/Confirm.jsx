import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { confirmEmail } from "../api/auth";

export default function Confirm() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [msg, setMsg] = useState("Confirming...");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("Missing token");
      setMsg(null);
      return;
    }

    confirmEmail(token)
      .then(() => setMsg("Email confirmed! You can login now."))
      .catch((e) => { setError(e.message); setMsg(null); });
  }, [token]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Confirm email</h1>
      {msg && <p>{msg}</p>}
      {error && <p>Error: {error}</p>}
      <Link to="/login">Go to login</Link>
    </div>
  );
}
