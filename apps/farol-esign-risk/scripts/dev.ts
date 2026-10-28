import { spawn, type ChildProcess } from "node:child_process";

const children: ChildProcess[] = [];

function run(command: string, args: string[]): ChildProcess {
  const child = spawn(command, args, { stdio: "inherit" });
  children.push(child);
  child.on("exit", (code) => {
    if (code && code !== 0) {
      shutdown(code);
    }
  });
  return child;
}

function shutdown(code = 0): void {
  for (const child of children) {
    child.kill();
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

run("bun", ["run", "server/index.ts"]);

async function waitForApi(): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:8787/api/health");
      if (response.ok) return;
    } catch {
      // still booting
    }
    await Bun.sleep(100);
  }
  throw new Error("API did not start on :8787");
}

await waitForApi();
run("bunx", ["vite", "--host", "127.0.0.1"]);
