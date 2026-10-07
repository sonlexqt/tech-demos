import { evaluate } from "./evaluation";
import { compare, type Fixture, ids } from "./extraction";

const assets: Record<string, string> = {
	"/": "public/index.html",
	"/app.js": "public/app.js",
	"/style.css": "public/style.css",
};
const server = Bun.serve({
	hostname: "127.0.0.1",
	port: Number(process.env.PORT || 3000),
	idleTimeout: 120,
	async fetch(req) {
		const url = new URL(req.url);
		if (url.pathname === "/api/compare" && req.method === "POST") {
			try {
				const body = await req.json();
				if (!ids.includes(body.fixture))
					return Response.json(
						{ error: "Unknown fixture; choose native, clean or degraded" },
						{ status: 400 },
					);
				const r = await compare(body.fixture as Fixture);
				return Response.json({
					...r,
					evaluation: {
						label:
							"Synthetic known-answer evaluation — unavailable for unknown production documents",
						native: evaluate(r.native.document.content),
						automatic: evaluate(r.automatic.document.content),
					},
					versions: { xberg: "1.3.5", bun: Bun.version },
				});
			} catch (error) {
				return Response.json(
					{ error: error instanceof Error ? error.message : String(error) },
					{ status: 422 },
				);
			}
		}
		const fixture = url.pathname.match(
			/^\/fixtures\/(native|clean|degraded)\.pdf$/,
		);
		const file =
			assets[url.pathname] || (fixture ? `fixtures/${fixture[1]}.pdf` : null);
		return file
			? new Response(Bun.file(new URL(file, import.meta.url)))
			: new Response("Not found", { status: 404 });
	},
});
console.log(`Document extraction-check lab: ${server.url}`);
