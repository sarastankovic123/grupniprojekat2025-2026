import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/auth": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/api/content": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/api/notifications": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
