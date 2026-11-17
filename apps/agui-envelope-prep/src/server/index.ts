import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createApp } from "./app";

const PORT = Number(process.env.PORT ?? 8787);
const app = createApp();
const staticDir = process.env.AGUI_STATIC ? join(process.cwd(), process.env.AGUI_STATIC) : null;

function contentType(path: string): string {
  if (path.endsWith(".html")) return "text/html; charset=utf-8";
  if (path.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (path.endsWith(".css")) return "text/css; charset=utf-8";
  if (path.endsWith(".pdf")) return "application/pdf";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);
    const api = await app.fetch(req);
    if (api.status !== 404 || url.pathname.startsWith("/agui") || url.pathname.startsWith("/api")) {
      return api;
    }
    if (staticDir) {
      const relative = url.pathname === "/" ? "/index.html" : url.pathname;
      const filePath = join(staticDir, relative);
      if (filePath.startsWith(staticDir)) {
        try {
          const data = await readFile(filePath);
          return new Response(data, { headers: { "content-type": contentType(filePath) } });
        } catch {
          if (!relative.includes(".")) {
            const index = await readFile(join(staticDir, "index.html"));
            return new Response(index, { headers: { "content-type": "text/html; charset=utf-8" } });
          }
        }
      }
    }
    return api;
  },
});

console.log(`AG-UI envelope prep API → http://localhost:${server.port}/agui`);
console.log(`Health                   → http://localhost:${server.port}/api/health`);
