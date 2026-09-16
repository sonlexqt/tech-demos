import { join } from "node:path";
import { handleApi } from "./handlers";

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
  const relative = pathname === "/" || pathname === "/claim" ? "/index.html" : pathname;
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

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "authorization, content-type",
          "access-control-allow-methods": "GET,POST,OPTIONS",
        },
      });
    }
    const api = await handleApi(req, url);
    if (api) {
      api.headers.set("access-control-allow-origin", "*");
      return api;
    }
    const asset = await staticFile(url.pathname);
    if (asset) return asset;
    return new Response("Not found", { status: 404 });
  },
});

console.log(`Harbor Notes auth.md demo → http://localhost:${server.port}/`);
console.log(`Discovery document         → http://localhost:${server.port}/auth.md`);
