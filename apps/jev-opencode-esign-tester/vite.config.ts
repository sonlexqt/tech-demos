import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { jevProxyPlugin } from "./src/server/jev-proxy";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.JEV_API_KEY || process.env.JEV_API_KEY || "";

  return {
    plugins: [react(), jevProxyPlugin(apiKey)],
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});
