import { STORAGE_TOKEN_KEY } from "../config";

function readToken() {
  return localStorage.getItem(STORAGE_TOKEN_KEY);
}

function buildUrl(path) {
  if (path.startsWith("http")) return path;
  if (!path.startsWith("/")) return `/${path}`;
  return path;
}

export async function apiFetch(path, options = {}) {
  const url = buildUrl(path);

  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData = hasBody && (options.body instanceof FormData);

  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = readToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let data = null;
  if (isJson) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await res.text();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && (data.message || data.error)) ||
      (typeof data === "string" && data) ||
      `Request failed (${res.status})`;

    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
