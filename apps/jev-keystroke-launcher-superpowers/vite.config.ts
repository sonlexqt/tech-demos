import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { createJevProxyPlugin } from "./server/jev-proxy";

export default defineConfig({
  plugins: [react(), createJevProxyPlugin()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
