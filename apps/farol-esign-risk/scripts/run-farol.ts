import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const sandbox = join(appRoot, ".farol-sandbox");
const reportsRoot = join(appRoot, "fixtures", "reports");
const publicRoot = join(appRoot, "public", "farol-reports");

const copyAllow = [
  "package.json",
  "tsconfig.json",
  "tsconfig.node.json",
  "vite.config.ts",
  "vitest.config.ts",
  "index.html",
  "farol.config.json",
  "farol.backend.config.json",
  "src",
  "server",
  "public",
  "bun.lock",
  ".gitignore",
];

function run(
  command: string,
  args: string[],
  cwd = sandbox,
): ReturnType<typeof spawnSync> {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    const detail = `${result.stdout}\n${result.stderr}`.trim();
    throw new Error(`${command} ${args.join(" ")} failed:\n${detail}`);
  }
  return result;
}

function farol(args: string[]): string {
  const result = run("npx", ["--yes", "@winninjs/farol", ...args]);
  return `${result.stdout}${result.stderr}`;
}

function copyOverlay(fromDir: string): void {
  cpSync(fromDir, sandbox, { recursive: true });
}

function writeReport(dir: string, name: string, analyzeArgs: string[]): void {
  mkdirSync(dir, { recursive: true });
  const jsonPath = join(dir, `${name}.json`);
  const mdPath = join(dir, `${name}.md`);
  const htmlPath = join(dir, `${name}.html`);
  farol(["analyze", ...analyzeArgs, "--out", jsonPath]);
  const markdown = farol(["report", "--in", jsonPath]);
  writeFileSync(mdPath, markdown);
  farol(["html", "--in", jsonPath, "--out", htmlPath]);
}

function copyReports(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

rmSync(sandbox, { recursive: true, force: true });
mkdirSync(sandbox, { recursive: true });

for (const name of copyAllow) {
  const source = join(appRoot, name);
  if (!existsSync(source)) continue;
  cpSync(source, join(sandbox, name), { recursive: true });
}

rmSync(join(sandbox, "public", "farol-reports"), { recursive: true, force: true });

run("bun", ["install"]);
run("git", ["init"]);
run("git", ["checkout", "-b", "baseline"]);
run("git", ["-c", "user.email=farol-fixture@local", "-c", "user.name=Farol Fixture", "add", "."]);
run("git", [
  "-c",
  "user.email=farol-fixture@local",
  "-c",
  "user.name=Farol Fixture",
  "commit",
  "-m",
  "baseline Lumin Sign fixture",
]);

function stripNpmNotice(text: string): string {
  return text
    .split("\n")
    .filter((line) => !line.startsWith("npm notice") && !line.startsWith("npm warn"))
    .join("\n")
    .trim();
}

const routesFrontend = farol(["routes"]);
const routesBackend = farol(["--config", "farol.backend.config.json", "routes"]);
mkdirSync(join(appRoot, "fixtures"), { recursive: true });
writeFileSync(
  join(appRoot, "fixtures", "routes-baseline.txt"),
  `# frontend\n${stripNpmNotice(routesFrontend)}\n\n# backend\n${stripNpmNotice(routesBackend)}\n`,
);

run("git", ["checkout", "-b", "scenario-a"]);
copyOverlay(join(appRoot, "scenarios", "A-harmless"));
run("git", ["-c", "user.email=farol-fixture@local", "-c", "user.name=Farol Fixture", "add", "-A"]);
run("git", [
  "-c",
  "user.email=farol-fixture@local",
  "-c",
  "user.name=Farol Fixture",
  "commit",
  "-m",
  "A: fix Recieved typo on envelope list",
]);
rmSync(join(reportsRoot, "scenario-a"), { recursive: true, force: true });
writeReport(join(reportsRoot, "scenario-a"), "frontend", ["--base", "baseline", "--head", "HEAD"]);
copyReports(join(reportsRoot, "scenario-a"), join(publicRoot, "scenario-a"));

run("git", ["checkout", "baseline"]);
run("git", ["checkout", "-b", "scenario-b"]);
copyOverlay(join(appRoot, "scenarios", "B-blast-radius"));
run("git", ["-c", "user.email=farol-fixture@local", "-c", "user.name=Farol Fixture", "add", "."]);
run("git", [
  "-c",
  "user.email=farol-fixture@local",
  "-c",
  "user.name=Farol Fixture",
  "commit",
  "-m",
  "B: shared hook gate + renamed envelope status field",
]);

const coverage = run("bun", [
  "x",
  "vitest",
  "run",
  "--coverage.enabled",
  "--coverage.reporter=json",
  "--coverage.reportsDirectory=reports/coverage",
]);
writeFileSync(join(reportsRoot, "scenario-b-test-log.txt"), `${coverage.stdout}\n${coverage.stderr}`);

rmSync(join(reportsRoot, "scenario-b"), { recursive: true, force: true });
writeReport(join(reportsRoot, "scenario-b"), "frontend", [
  "--base",
  "baseline",
  "--head",
  "HEAD",
  "--coverage",
  "reports/coverage/coverage-final.json",
]);
writeReport(join(reportsRoot, "scenario-b"), "backend", [
  "--config",
  "farol.backend.config.json",
  "--base",
  "baseline",
  "--head",
  "HEAD",
]);
copyReports(join(reportsRoot, "scenario-b"), join(publicRoot, "scenario-b"));

rmSync(sandbox, { recursive: true, force: true });
console.log("Wrote farol reports to fixtures/reports and public/farol-reports");
