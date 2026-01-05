import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { STORAGE_TOKEN_KEY, TOKEN_RESPONSE_FIELD } from "../config";
import { apiFetch } from "../api/apiFetch";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(STORAGE_TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    if (accessToken) localStorage.setItem(STORAGE_TOKEN_KEY, accessToken);
    else localStorage.removeItem(STORAGE_TOKEN_KEY);
  }, [accessToken]);

  useEffect(() => {
    setBootstrapped(true);
  }, []);

  async function register(payload) {
    return apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async function confirm(payload) {
    return apiFetch("/api/auth/confirm", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async function login(payload) {

    return apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async function verifyOtp(payload) {
    const data = await apiFetch("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const token = data?.[TOKEN_RESPONSE_FIELD];
    if (!token) {
      throw new Error("Missing accessToken in verify-otp response");
    }

    setAccessToken(token);
    return data;
  }

  function logout() {
    setAccessToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      accessToken,
      isAuthenticated: !!accessToken,
      user,
      bootstrapped,

      register,
      confirm,
      login,
      verifyOtp,
      logout,
    }),
    [accessToken, user, bootstrapped]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
