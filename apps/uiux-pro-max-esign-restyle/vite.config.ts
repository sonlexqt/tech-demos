import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const appRoot = fileURLToPath(new URL(".", import.meta.url));

function serveRepoMarkdown(): Plugin {
  const files = new Set(["/HOW_IT_WORKS.md", "/README.md", "/PLAN.md"]);
  return {
    name: "serve-repo-markdown",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split("?")[0] ?? "";
        if (!files.has(path)) {
          next();
          return;
        }
        res.setHeader("Content-Type", "text/markdown; charset=utf-8");
        res.end(readFileSync(resolve(appRoot, path.slice(1))));
      });
    },
  };
}

export default defineConfig({
  plugins: [serveRepoMarkdown()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 5173,
  },
});
