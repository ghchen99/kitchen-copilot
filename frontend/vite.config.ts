import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During dev, proxy API + AG-UI calls to the FastAPI backend so the frontend can
// use relative paths (and avoid CORS entirely).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/agent": "http://127.0.0.1:8000",
    },
  },
});
