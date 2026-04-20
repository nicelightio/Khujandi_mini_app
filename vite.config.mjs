import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isDebugEnabled = String(process.env.DEBUG ?? "FALSE").toLowerCase() === "true";

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_DEBUG__: JSON.stringify(isDebugEnabled),
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
  },
});
