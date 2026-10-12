import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalized = id.replace(/\\/g, "/");
            if (
              normalized.includes("/node_modules/react/") ||
              normalized.includes("/node_modules/react-dom/")
            ) {
              return "vendor-react";
            }
            if (
              normalized.includes("/node_modules/gsap/") ||
              normalized.includes("/node_modules/lenis/")
            ) {
              return "vendor-motion";
            }
          },
        },
      },
    },
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
