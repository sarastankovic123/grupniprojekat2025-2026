import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/auth": "http://localhost:8001",
      "/api/content": "http://localhost:8002",
      "/api/notifications": "http://localhost:8003",
    },

      "/api/content": {
        target: "https://localhost",
        changeOrigin: true,
        secure: false,
      },

      "/api/notifications": {
        target: "https://localhost",
        changeOrigin: true,
        secure: false,
      },
    },
  },
);
