import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { createJevMiddleware } from "./src/server/jev";

function jevComposePlugin(env: Record<string, string>): Plugin {
  const middleware = createJevMiddleware({ ...process.env, ...env });
  return {
    name: "jev-compose",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), jevComposePlugin(env)],
  };
});
