import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
  };
});
