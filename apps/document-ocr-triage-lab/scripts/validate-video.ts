import { expect } from "bun:test";
import { chromium } from "playwright";

const server = Bun.serve({
	port: 3001,
	hostname: "127.0.0.1",
	fetch(req) {
		return new URL(req.url).pathname === "/video"
			? new Response(Bun.file("evidence/walkthrough.mp4"))
			: new Response(
					'<video controls muted width="960" src="/video"></video>',
					{ headers: { "Content-Type": "text/html" } },
				);
	},
});
const browser = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox"],
	headless: true,
});
const page = await browser.newPage();
await page.goto("http://127.0.0.1:3001");
await page.waitForFunction(
	() => document.querySelector("video")!.readyState >= 2,
);
const result = await page.evaluate(async () => {
	const v = document.querySelector("video")!;
	await v.play();
	await new Promise((r) => setTimeout(r, 1200));
	return {
		duration: v.duration,
		currentTime: v.currentTime,
		width: v.videoWidth,
		height: v.videoHeight,
		error: v.error?.message ?? null,
	};
});
expect(result.currentTime).toBeGreaterThan(0.5);
expect(result.error).toBeNull();
expect(result.duration).toBeGreaterThan(60);
expect(result.duration).toBeLessThan(100);
await Bun.write("evidence/playback.json", JSON.stringify(result, null, 2));
await browser.close();
server.stop();
