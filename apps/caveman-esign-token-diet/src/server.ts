import { join } from "node:path";
import { TASKS } from "./fixtures";
import { liveProvider } from "./llm";
import { trimInput } from "./proxy";
import { compareTask } from "./replay";
import { RATES } from "./tokens";

const PORT = Number(process.env.PORT ?? 5173);
const PUBLIC_DIR = join(import.meta.dir, "../public");

function contentType(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".md")) return "text/markdown; charset=utf-8";
  return "application/octet-stream";
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

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}

async function handleApi(req: Request, url: URL): Promise<Response | null> {
  if (url.pathname === "/api/meta" && req.method === "GET") {
    const provider = liveProvider();
    return json({
      liveAvailable: provider !== "fixture",
      provider,
      rates: RATES,
      notes:
        "Offline fixtures are the default. A live key is optional and never required to review the demo.",
    });
  }

  if (url.pathname === "/api/tasks" && req.method === "GET") {
    return json(
      TASKS.map((task) => ({
        id: task.id,
        title: task.title,
        question: task.question,
        blurb: task.blurb,
        facts: task.facts,
        rawBytes: task.rawInput.length,
      })),
    );
  }

  if (url.pathname === "/api/payload" && req.method === "GET") {
    const task = TASKS.find((item) => item.id === url.searchParams.get("task"));
    if (!task) return json({ error: "Unknown task" }, 404);
    const trimmed = trimInput(task.rawInput);
    return json({
      raw: task.rawInput,
      trimmed,
      rawBytes: task.rawInput.length,
      trimmedBytes: trimmed.length,
    });
  }

  if (url.pathname === "/api/compare" && req.method === "POST") {
    const body = (await req.json().catch(() => ({}))) as { taskId?: string; live?: boolean };
    if (!body.taskId) return json({ error: "taskId required" }, 400);
    try {
      const result = await compareTask(body.taskId, Boolean(body.live));
      return json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "compare failed";
      return json({ error: message }, 500);
    }
  }

  return null;
}

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "content-type",
          "access-control-allow-methods": "GET,POST,OPTIONS",
        },
      });
    }
    const api = await handleApi(req, url);
    if (api) return api;
    const asset = await staticFile(url.pathname);
    if (asset) return asset;
    return new Response("Not found", { status: 404 });
  },
});

const provider = liveProvider();
console.log(`Caveman e-sign token diet → http://localhost:${server.port}/`);
console.log(`Mode: ${provider === "fixture" ? "offline fixtures" : `live (${provider})`}`);
