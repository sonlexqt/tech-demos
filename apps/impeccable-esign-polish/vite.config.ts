import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { defineConfig, type Plugin } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const execFileAsync = promisify(execFile);

function impeccableDetectPlugin(): Plugin {
  return {
    name: "impeccable-detect",
    configureServer(server) {
      server.middlewares.use("/api/detect", async (_req, res) => {
        const target = path.join(root, "fixtures/signer-slop.html");
        const fallbackPath = path.join(root, "fixtures/findings.cli.json");
        try {
          const { stdout } = await execFileAsync(
            "npx",
            ["--yes", "impeccable", "detect", "--json", target],
            { cwd: root, timeout: 60_000, maxBuffer: 2_000_000 },
          );
          const findings = JSON.parse(stdout);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ source: "cli", exit: 0, findings }));
        } catch (err: unknown) {
          const execErr = err as { stdout?: string; status?: number; message?: string };
          const stdout = typeof execErr.stdout === "string" ? execErr.stdout : "";
          if (stdout.trim().startsWith("[")) {
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                source: "cli",
                exit: execErr.status ?? 2,
                findings: JSON.parse(stdout),
              }),
            );
            return;
          }
          const bundled = JSON.parse(await readFile(fallbackPath, "utf8"));
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              source: "fixture",
              exit: bundled.exit ?? 2,
              findings: bundled.findings,
              note: execErr.message ?? "CLI unavailable; using captured findings.",
            }),
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [impeccableDetectPlugin()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
