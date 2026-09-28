import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { jevRankPlugin } from "./server/plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return {
    plugins: [react(), jevRankPlugin()],
    server: {
      port: 5173,
      strictPort: true,
      host: true,
    },
  };
});
