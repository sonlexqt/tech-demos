import { defineConfig, type Plugin, type ViteDevServer } from "vite";

function geminiProxy(): Plugin {
  return {
    name: "gemini-proxy",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/gemini-status", (_req, res) => {
        const key = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ enabled: Boolean(key) }));
      });
      server.middlewares.use("/api/gemini", (req, res) => {
        void (async () => {
          const key = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;
          if (!key) {
            res.statusCode = 501;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "GEMINI_API_KEY is not set. Mock agent still works." }));
            return;
          }
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.end("POST only");
            return;
          }
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const body = Buffer.concat(chunks).toString("utf8");
          const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
          const upstream = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=` +
              encodeURIComponent(key),
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body,
            },
          );
          res.statusCode = upstream.status;
          res.setHeader("Content-Type", "application/json");
          res.end(await upstream.text());
        })().catch((error: unknown) => {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: String(error) }));
        });
      });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [geminiProxy()],
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
