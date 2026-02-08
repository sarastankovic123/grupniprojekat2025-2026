import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: "../certs/localhost.key",
      cert: "../certs/localhost.crt",
    },
    proxy: {
      // All API requests go through the API gateway (nginx → gateway → services)
      "/api": {
        target: "https://localhost:8443",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
