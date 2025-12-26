import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, verifyOtp, setToken } from "../api/auth";

export default function Login() {
  const nav = useNavigate();

  const [step, setStep] = useState(1); //
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  const onSendOtp = async (e) => {
    e.preventDefault();
    setMsg(null);
    setError(null);

    try {
      const res = await login(email, password);
      setMsg(res?.message || "OTP sent.");
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  };

  const onVerify = async (e) => {
    e.preventDefault();
    setMsg(null);
    setError(null);

    try {
      const res = await verifyOtp(email, otp);
      if (!res?.accessToken) throw new Error("No accessToken returned");
      setToken(res.accessToken);
      nav("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Login</h1>

      {step === 1 ? (
        <form onSubmit={onSendOtp} style={{ display: "grid", gap: 8, maxWidth: 360 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button type="submit">Send OTP</button>
        </form>
      ) : (
        <form onSubmit={onVerify} style={{ display: "grid", gap: 8, maxWidth: 360 }}>
          <p>Enter OTP sent to your email:</p>
          <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="OTP" />
          <button type="submit">Verify OTP</button>
          <button type="button" onClick={() => setStep(1)}>Back</button>
        </form>
      )}

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
      {error && <p style={{ marginTop: 10 }}>Error: {error}</p>}

      <p style={{ marginTop: 10 }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
