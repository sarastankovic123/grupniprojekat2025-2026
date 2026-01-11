import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // content preko gateway-a
      "/api/content": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        secure: false,
      },

      // auth direktno na users-service (magic link, login, register...)
      "/api/auth": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
        secure: false,
      },

      // notifications direktno na notification-service (ako koristiš)
      "/api/notifications": {
        target: "http://127.0.0.1:8003",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
