import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const appRoot = dirname(fileURLToPath(import.meta.url));

function graphifyLivePlugin(): Plugin {
  return {
    name: "graphify-live-status",
    configureServer(server) {
      server.middlewares.use("/HOW_IT_WORKS.md", (_req, res) => {
        res.setHeader("Content-Type", "text/markdown; charset=utf-8");
        res.end(readFileSync(join(appRoot, "HOW_IT_WORKS.md")));
      });
      server.middlewares.use("/api/graphify-status", (_req, res) => {
        const probe = spawnSync("graphify", ["--version"], {
          encoding: "utf8",
          timeout: 2500,
        });
        const available = probe.status === 0;
        const version = available ? (probe.stdout || probe.stderr || "").trim() : null;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            available,
            version,
            note: available
              ? "graphify CLI detected. This demo still answers from the shipped fixture graph.json; a real hook would run `graphify query` / `graphify path`."
              : "graphify CLI is not on PATH. Fixture mode only — no CLI required.",
          }),
        );
      });
    },
  };
}

export default defineConfig({
  plugins: [graphifyLivePlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
