import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createApp } from "./app";
import { bindingsFromProcess } from "./env";

const PORT = Number(process.env.PORT ?? 8787);
const app = createApp();
const env = bindingsFromProcess();
const staticDir = process.env.LUMIN_STATIC ? join(process.cwd(), process.env.LUMIN_STATIC) : null;

function contentType(path: string): string {
  if (path.endsWith(".html")) return "text/html; charset=utf-8";
  if (path.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (path.endsWith(".css")) return "text/css; charset=utf-8";
  if (path.endsWith(".pdf")) return "application/pdf";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".mjs")) return "text/javascript; charset=utf-8";
  if (path.endsWith(".woff2")) return "font/woff2";
  return "application/octet-stream";
}

const apiPrefixes = ["/oauth2", "/files", "/folders", "/users", "/api", "/open-with", "/2.0"];

function isApi(pathname: string): boolean {
  return apiPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);
    if (isApi(url.pathname) || req.method === "OPTIONS") {
      return app.fetch(req, env);
    }
    if (staticDir) {
      const relative = url.pathname === "/" || url.pathname === "/open-with" ? "/index.html" : url.pathname;
      const mapped = url.pathname === "/open-with" ? "/editor.html" : relative;
      const filePath = join(staticDir, mapped);
      if (filePath.startsWith(staticDir)) {
        try {
          const data = await readFile(filePath);
          return new Response(data, { headers: { "content-type": contentType(filePath) } });
        } catch {
          if (!mapped.includes(".")) {
            const index = await readFile(join(staticDir, "index.html"));
            return new Response(index, { headers: { "content-type": "text/html; charset=utf-8" } });
          }
        }
      }
    }
    return app.fetch(req, env);
  },
});

const mode = env.BOX_CLIENT_ID && env.BOX_CLIENT_SECRET ? "LIVE" : "MOCK";
console.log(`Box Open-with Lumin API → http://localhost:${server.port}/  (${mode} mode)`);
console.log(`Health                   → http://localhost:${server.port}/api/health`);
