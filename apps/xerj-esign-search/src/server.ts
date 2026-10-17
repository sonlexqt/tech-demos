import { join } from "node:path";

const PORT = Number(process.env.PORT ?? 5173);
const ROOT = join(import.meta.dir, "..");
const PUBLIC_DIR = join(ROOT, "public");
const FIXTURES = join(ROOT, "fixtures");

function contentType(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".md")) return "text/markdown; charset=utf-8";
  return "application/octet-stream";
}

async function readDemo(): Promise<unknown> {
  const file = Bun.file(join(FIXTURES, "demo.json"));
  return file.json();
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function staticFile(pathname: string): Promise<Response | null> {
  const relative = pathname === "/" ? "/index.html" : pathname;
  const filePath = join(PUBLIC_DIR, relative);
  if (!filePath.startsWith(PUBLIC_DIR)) return null;
  const file = Bun.file(filePath);
  if (!(await file.exists())) return null;
  return new Response(file, {
    headers: {
      "content-type": contentType(filePath),
      "cache-control": "no-store",
    },
  });
}

const liveEnabled = process.env.XERJ_LIVE === "1";

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/api/demo") {
      const demo = (await readDemo()) as Record<string, unknown>;
      return jsonResponse({
        ...demo,
        mode: liveEnabled ? "live-available" : "fixture",
        liveEnabled,
      });
    }

    if (url.pathname === "/api/live" && req.method === "POST") {
      if (!liveEnabled) {
        return jsonResponse(
          {
            error: "Live mode is off. Set XERJ_LIVE=1, start a xerj node, then restart this server.",
          },
          403,
        );
      }
      const proc = Bun.spawn(["python3", "scripts/capture.py"], {
        cwd: ROOT,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, XERJ_DISABLE_FEEDBACK: "true" },
      });
      const exit = await proc.exited;
      const assemble = Bun.spawn(["python3", "scripts/assemble_demo.py"], {
        cwd: ROOT,
        stdout: "pipe",
        stderr: "pipe",
      });
      await assemble.exited;
      const demo = await readDemo();
      return jsonResponse({
        recaptured: exit === 0,
        exit,
        demo,
      });
    }

    const file = await staticFile(url.pathname);
    if (file) return file;
    return new Response("Not found", { status: 404 });
  },
});

console.log(`xerj-esign-search  http://127.0.0.1:${server.port}/  mode=${liveEnabled ? "live-available" : "fixture"}`);
