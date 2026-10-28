import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

const frontend = spawnSync(
  "npx",
  ["--yes", "@winninjs/farol", "--cwd", appRoot, "routes"],
  { stdio: "inherit", encoding: "utf8" },
);

if (frontend.status !== 0) {
  process.exit(frontend.status ?? 1);
}

console.log("\n--- backend ---\n");

const backend = spawnSync(
  "npx",
  [
    "--yes",
    "@winninjs/farol",
    "--cwd",
    appRoot,
    "--config",
    "farol.backend.config.json",
    "routes",
  ],
  { stdio: "inherit", encoding: "utf8" },
);

process.exit(backend.status ?? 1);
