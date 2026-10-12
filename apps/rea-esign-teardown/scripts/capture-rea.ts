import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundleDir = resolve(root, "fixtures/signer-bundle");
const outDir = resolve(root, "fixtures/rea-output");
const live = process.env.REA_LIVE === "1";

function nodeBin(): string {
  const override = process.env.REA_NODE;
  if (override) {
    return override;
  }
  return resolve(homedir(), ".nvm/versions/node/v22.23.3/bin/node");
}

function npxBin(): string {
  const override = process.env.REA_NPX;
  if (override) {
    return override;
  }
  return resolve(homedir(), ".nvm/versions/node/v22.23.3/bin/npx");
}

async function run(command: string, args: string[], cwd = root): Promise<string> {
  return await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${command} ${args.join(" ")} failed (${code})\n${stderr}`));
        return;
      }
      resolvePromise(stdout);
    });
  });
}

function parseJsonDocument(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error(`could not parse REA JSON\n${trimmed.slice(0, 400)}`);
  }
}

async function writeJson(name: string, value: unknown): Promise<void> {
  const path = resolve(outDir, name);
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  console.log(`wrote ${path}`);
}

async function rea(args: string[]): Promise<unknown> {
  const stdout = await run(npxBin(), ["-y", "rea-agents@latest", ...args, "--json"]);
  return parseJsonDocument(stdout);
}

console.log("building signer bundle…");
await run(process.execPath, [resolve(root, "scripts/build-signer.ts")]);

if (!live) {
  console.log("REA_LIVE is not 1. Offline fixtures in fixtures/rea-output/ are left unchanged.");
  console.log("Re-run with REA_LIVE=1 to call rea-agents against the minified bundle.");
  process.exit(0);
}

await mkdir(outDir, { recursive: true });

console.log(`analyzing ${bundleDir} with rea-agents (node ${nodeBin()})…`);
process.env.PATH = `${dirname(nodeBin())}:${process.env.PATH ?? ""}`;

const analyze = await rea(["analyze-javascript-application", bundleDir]);
await writeJson("analyze-javascript-application.json", analyze);

const scratch = await mkdtemp(join(tmpdir(), "rea-esign-"));
const inspectInputPath = join(scratch, "inspect-analysis-view.input.json");
await writeFile(
  inspectInputPath,
  `${JSON.stringify({ source: { kind: "inline", evidence: analyze }, view: { kind: "summary" } })}\n`,
  "utf8",
);
const summary = await rea(["inspect-analysis-view", inspectInputPath]);
await writeJson("inspect-analysis-view-summary.json", summary);

const seeds = [
  { kind: "string", value: "lumin-sign-flow:place-field" },
  { kind: "string", value: "lumin-sign-flow:capture" },
  { kind: "string", value: "lumin-sign-flow:pdf-write" },
  { kind: "string", value: "lumin-sign-field:signature" },
  { kind: "string", value: "lumin-sign-write:embedPng" },
  { kind: "string", value: "pointerdown" },
] as const;

for (const seed of seeds) {
  const input = {
    application: analyze,
    seed,
    direction: "both",
  };
  const slug = seed.value.replaceAll(":", "-");
  const inputPath = join(scratch, `trace-${slug}.input.json`);
  await writeFile(inputPath, `${JSON.stringify(input)}\n`, "utf8");
  const result = await rea(["trace-application-feature", inputPath]);
  await writeJson(`trace-${slug}.json`, result);
}

const captureMeta = {
  captured_at: new Date().toISOString(),
  rea_package: "rea-agents@6.4.0",
  commands: [
    `npx -y rea-agents@latest analyze-javascript-application ${bundleDir} --json`,
    "npx -y rea-agents@latest inspect-analysis-view fixtures/rea-output/inspect-analysis-view.input.json --json",
    "npx -y rea-agents@latest trace-application-feature <seed-input> --json",
  ],
  node: await run(nodeBin(), ["-v"]).then((text) => text.trim()),
  target: bundleDir,
  live: true,
  notes:
    "Static JavaScript analysis only. No Ghidra/Hopper/IDA. No API keys. Analysis is local.",
};

await writeJson("capture-meta.json", captureMeta);
await run(process.execPath, [resolve(root, "scripts/extract-evidence-index.ts")]);
console.log("REA capture complete.");
