import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/auth": {
        target: "https://localhost",
        changeOrigin: true,
        secure: false,
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
});
