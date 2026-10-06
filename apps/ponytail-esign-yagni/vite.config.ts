import { defineConfig, type Plugin } from "vite";
import { detectProvider, runReview } from "./src/server/review-api";

function optionalLlm(): Plugin {
  return {
    name: "optional-llm",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";

        if (url === "/api/llm-status") {
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(detectProvider()));
          return;
        }

        if (url === "/api/review" && req.method === "POST") {
          const result = await runReview();
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(result));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [optionalLlm()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
});
