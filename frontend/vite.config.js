import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readHttpsConfig(env) {
  const explicitKey = env?.VITE_HTTPS_KEY_PATH || process.env.VITE_HTTPS_KEY_PATH;
  const explicitCert =
    env?.VITE_HTTPS_CERT_PATH || process.env.VITE_HTTPS_CERT_PATH;

  const candidates = [
    explicitKey && explicitCert
      ? {
          keyPath: path.resolve(__dirname, explicitKey),
          certPath: path.resolve(__dirname, explicitCert),
        }
      : null,
    {
      keyPath: path.resolve(__dirname, "../certs/localhost.key"),
      certPath: path.resolve(__dirname, "../certs/localhost.crt"),
    },
    {
      keyPath: path.resolve(__dirname, "../nginx/certs/server.key"),
      certPath: path.resolve(__dirname, "../nginx/certs/server.crt"),
    },
  ].filter(Boolean);

  for (const { keyPath, certPath } of candidates) {
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
    }
  }

  return false;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");

  return {
    plugins: [react()],
    server: {
      https: readHttpsConfig(env),
      proxy: {
        "/api": {
          target: "https://127.0.0.1:8443",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
