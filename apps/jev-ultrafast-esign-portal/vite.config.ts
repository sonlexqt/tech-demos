import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { jevDecidePlugin } from "./server/plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return {
    plugins: [react(), jevDecidePlugin()],
    server: {
      port: 5173,
      strictPort: true,
      host: true,
    },
  };
});
