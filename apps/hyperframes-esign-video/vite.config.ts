import { defineConfig, type Plugin } from "vite";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".txt": "text/plain; charset=utf-8",
};

function serveDir(urlPrefix: string, diskDir: string): Plugin {
  return {
    name: `serve-${urlPrefix.replaceAll("/", "")}`,
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        if (!url.startsWith(urlPrefix)) return next();
        const rel = decodeURIComponent(url.slice(urlPrefix.length));
        const abs = normalize(join(diskDir, rel));
        if (!abs.startsWith(diskDir)) {
          res.statusCode = 403;
          res.end("forbidden");
          return;
        }
        if (!existsSync(abs) || !statSync(abs).isFile()) return next();
        res.setHeader("content-type", MIME[extname(abs)] ?? "application/octet-stream");
        res.setHeader("cache-control", "no-store");
        createReadStream(abs).pipe(res);
      });
    },
  };
}

export default defineConfig({
  root,
  publicDir: "public",
  server: { port: 5173, strictPort: true },
  plugins: [serveDir("/hf/", resolve(root, "videos"))],
});
