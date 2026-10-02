import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    {
      name: "markdown-docs",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split("?")[0] ?? "";
          if (url === "/HOW_IT_WORKS.md" || url === "/README.md" || url === "/PLAN.md") {
            const file = url.slice(1);
            if (existsSync(file)) {
              res.setHeader("content-type", "text/markdown; charset=utf-8");
              res.end(readFileSync(file));
              return;
            }
          }
          next();
        });
      },
    },
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});
