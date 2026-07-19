// Author: Lucas Mohler
// Vite dev-server config: proxies /api to the local FastAPI backend so the
// frontend code can always call the same relative path in dev and in prod
// (where nginx performs the equivalent proxy inside the container).
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
