/**
 * Re-captures committed run fixtures. Needs no API key.
 *   bun run capture-results
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { summarizeReport } from "./summarize-report";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = join(root, ".e2e", "report.json");
const outDir = join(root, "public", "fixtures", "runs");

function run(args: string[], env: Record<string, string> = {}): void {
  const result = spawnSync(join(root, "node_modules/.bin/e2e"), args, {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      E2E_TELEMETRY_DISABLED: "1",
      CI: "0",
      ...env,
    },
  });
  if (result.status !== 0 && !env.E2E_ALLOW_FAIL) {
    throw new Error(`e2e ${args.join(" ")} exited ${result.status}`);
  }
}

function write(name: string, fixture: ReturnType<typeof summarizeReport>): void {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `${name}.json`), `${JSON.stringify(fixture, null, 2)}\n`);
  console.log(`wrote public/fixtures/runs/${name}.json`);
}

run(["run", "tests/envelope.e2e.ts", "--no-cache", "--reporter", "json"], {
  E2E_EXPECT_REPLAY: "0",
});
write(
  "cold",
  summarizeReport(reportPath, {
    label: "Cold (no cache)",
    command: "E2E_TELEMETRY_DISABLED=1 e2e run tests/envelope.e2e.ts --no-cache",
    notes:
      "Scripted executor planned every agent.act. No model. --no-cache disables replay and recording, so cache.mode is absent.",
  }),
);

run(["run", "tests/envelope.e2e.ts", "--reporter", "json"], {
  E2E_EXPECT_REPLAY: "1",
});
write(
  "replay",
  summarizeReport(reportPath, {
    label: "Cached replay",
    command: "E2E_TELEMETRY_DISABLED=1 E2E_EXPECT_REPLAY=1 e2e run tests/envelope.e2e.ts",
    notes:
      "Committed fixtures/e2e-cache entries replayed each act. Zero model calls until the UI changes.",
  }),
);

run(["run", "tests/envelope.e2e.ts", "--reporter", "json"], {
  E2E_EXPECT_REPLAY: "0",
  E2E_VARIANT: "drift",
  E2E_CACHE_MODE: "read-only",
});
write(
  "drift",
  summarizeReport(reportPath, {
    label: "UI drift",
    command: "E2E_TELEMETRY_DISABLED=1 E2E_VARIANT=drift e2e run tests/envelope.e2e.ts",
    notes:
      "Same test id and routes, renamed buttons. Replay handed off (or missed); the executor re-planned. Hard assertions still see Awaiting countersignature instead of Completed.",
  }),
);

run(["run", "tests/bug-completed.e2e.ts", "--reporter", "json"], {
  E2E_EXPECT_REPLAY: "0",
  E2E_ALLOW_FAIL: "1",
  E2E_CACHE_MODE: "read-only",
  E2E_RUN_BUG: "1",
});
write(
  "bug",
  summarizeReport(reportPath, {
    label: "Injected bug (expected fail)",
    command: "E2E_TELEMETRY_DISABLED=1 e2e run tests/bug-completed.e2e.ts",
    notes:
      "Same drifted UI. expect(status).toHaveText('Completed') fails — the locator assertion catches the real bug.",
  }),
);
