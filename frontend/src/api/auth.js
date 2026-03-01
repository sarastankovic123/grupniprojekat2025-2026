const TOKEN_KEY = "accessToken";

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `access_token=${encodeURIComponent(token)}; path=/; SameSite=Strict; Secure`;
}
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; Secure";
}

async function request(path, options = {}) {
  const res = await fetch(path, options);
  const text = await res.text();

  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    const msg = typeof data === "object" && data?.error ? data.error : text;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data;
}

export function register(payload) {
  return request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function confirmEmail(token) {
  return request(`/api/auth/confirm?token=${encodeURIComponent(token)}`, {
    method: "GET",
  });
}

export function login(email, password) {
  return request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function verifyOtp(email, otp) {
  return request("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
}
