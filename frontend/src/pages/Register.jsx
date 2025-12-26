import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";

export default function Register() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });

  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMsg(null);

    try {
      const res = await register(form);
      setMsg(res?.message || "Registration successful. Please confirm your email.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Register</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 360 }}>
        <input name="username" value={form.username} onChange={onChange} placeholder="Username" />
        <input name="email" value={form.email} onChange={onChange} placeholder="Email" />
        <input name="firstName" value={form.firstName} onChange={onChange} placeholder="First name" />
        <input name="lastName" value={form.lastName} onChange={onChange} placeholder="Last name" />
        <input type="password" name="password" value={form.password} onChange={onChange} placeholder="Password" />
        <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={onChange} placeholder="Confirm password" />
        <button type="submit">Register</button>
      </form>

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
      {error && <p style={{ marginTop: 10 }}>Error: {error}</p>}

      <p style={{ marginTop: 10 }}>
        Already have account? <Link to="/login">Login</Link>
      </p>

      <button style={{ marginTop: 10 }} onClick={() => nav("/login")}>
        Go to Login
      </button>
    </div>
  );
}
