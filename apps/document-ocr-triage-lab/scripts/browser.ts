import { expect } from "bun:test";
import { chromium } from "playwright";

const browser = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	headless: true,
	args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
	viewport: { width: 1440, height: 1100 },
	recordVideo: { dir: "evidence", size: { width: 1440, height: 1100 } },
});
const page = await context.newPage();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:3000");
await page.evaluate(() => {
	const style = document.createElement("style");
	style.textContent =
		"#demo-cursor{position:fixed;width:18px;height:18px;border:3px solid #ec7844;border-radius:50%;pointer-events:none;z-index:99999;box-shadow:0 0 0 4px #ec784430;transition:background .15s}#demo-caption{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#142e28f5;color:white;padding:15px 25px;border-radius:8px;z-index:99998;font:600 17px system-ui;text-align:center;max-width:1100px;width:max-content;box-shadow:0 3px 20px #0003}#demo-key{position:fixed;right:18px;top:85px;background:#e9bc62;color:#27352b;padding:10px 16px;border-radius:5px;z-index:99999;font:700 14px monospace;display:none}";
	document.head.append(style);
	for (const id of ["demo-cursor", "demo-caption", "demo-key"]) {
		const e = document.createElement("div");
		e.id = id;
		document.body.append(e);
	}
	document.addEventListener("mousemove", (e) => {
		const c = document.getElementById("demo-cursor");
		if (c) {
			c.style.left = `${e.clientX - 9}px`;
			c.style.top = `${e.clientY - 9}px`;
		}
	});
	document.addEventListener("mousedown", () => {
		const c = document.getElementById("demo-cursor");
		if (c) {
			c.style.background = "#ec7844";
			setTimeout(() => {
				c.style.background = "transparent";
			}, 450);
		}
	});
	document.addEventListener("keydown", (e) => {
		const k = document.getElementById("demo-key");
		if (k) {
			k.textContent = `⌨ ${e.key}`;
			k.style.display = "block";
			setTimeout(() => {
				k.style.display = "none";
			}, 1500);
		}
	});
});
async function caption(text: string) {
	await page.locator("#demo-caption").evaluate((el, t) => {
		el.textContent = t;
	}, text);
}
async function pause() {
	await page.waitForTimeout(5500);
}
async function click(selector: string) {
	const box = await page.locator(selector).boundingBox();
	if (!box) throw Error(selector);
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
		steps: 20,
	});
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}
async function run() {
	await click("#run");
	await page.waitForFunction(() =>
		document.getElementById("status")?.textContent?.startsWith("Completed:"),
	);
}
await caption(
	"A local experiment: what survives PDF extraction? Every document is synthetic.",
);
await page.mouse.move(900, 180, { steps: 20 });
await pause();
await caption(
	"Two real Xberg passes: native only versus automatic Tesseract English OCR.",
);
await run();
await pause();
expect(await page.locator("#evaluation").innerText()).toContain(
	"Native: 7/7 recovered",
);
await caption(
	"Native text preserves 7/7 fields in both passes. Timings are observations.",
);
await page.locator(".evaluation").scrollIntoViewIfNeeded();
await pause();
await page.evaluate(() => window.scrollTo(0, 0));
await caption(
	"Select an image-only scan with the keyboard. It has no native text layer.",
);
await page.locator("#fixture").focus();
await page.keyboard.press("ArrowDown");
await page.keyboard.press("Tab");
await pause();
await caption(
	"Run fresh extraction. The baseline is empty; local OCR recovers the invoice.",
);
await run();
await pause();
expect(await page.locator("#evaluation").innerText()).toContain(
	"Native: 0/7 recovered",
);
expect(await page.locator("#evaluation").innerText()).toContain(
	"Automatic: 7/7 recovered",
);
await caption(
	"Page OCR confidence is present: “OCR observed”. It is not an accuracy guarantee.",
);
await click("#automatic-result details:nth-of-type(2) summary");
await pause();
await click("#automatic-result details:nth-of-type(2) summary");
await page.locator(".evaluation").scrollIntoViewIfNeeded();
await caption(
	"The purple section uses a separate answer key: 0/7 becomes 7/7.",
);
await pause();
await page.locator("#demo-caption").evaluate((el) => {
	(el as HTMLElement).style.display = "none";
});
await page.screenshot({ path: "evidence/clean-scan.png", fullPage: true });
await page.locator("#demo-caption").evaluate((el) => {
	(el as HTMLElement).style.display = "block";
});
await page.evaluate(() => window.scrollTo(0, 0));
await caption(
	"Now a degraded scan: blur, downsampling, a masked total, and a native Bates stamp.",
);
await page.locator("#fixture").focus();
await page.keyboard.press("ArrowDown");
await page.keyboard.press("Tab");
await pause();
await run();
await caption(
	"A clean Bates stamp can score 1.00 while most invoice fields are missing.",
);
await pause();
await click("#native-result details:nth-of-type(1) summary");
await caption(
	"Warnings and review reasons remain visible. Heuristics are prompts to inspect.",
);
await pause();
await click("#native-result details:nth-of-type(1) summary");
await page.locator(".evaluation").scrollIntoViewIfNeeded();
await caption(
	"OCR improves recovery, but the damaged total is still wrong and visibly counted.",
);
await pause();
expect(await page.locator("#evaluation").innerText()).toContain(
	"Automatic: 6/7 recovered",
);
await caption(
	"Known-answer accuracy is evaluation data. Production telemetry cannot supply these answers.",
);
await pause();
await page.locator(".notes").scrollIntoViewIfNeeded();
await caption(
	"Cleanliness is not completeness. Missing confidence stays unknown. Human review matters.",
);
await pause();
await page.locator("#demo-caption").evaluate((el) => {
	(el as HTMLElement).style.display = "none";
});
await page.screenshot({ path: "evidence/degraded-scan.png", fullPage: true });
const response = await page.request.post("http://127.0.0.1:3000/api/compare", {
	data: { fixture: "../bad" },
});
expect(response.status()).toBe(400);
await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => window.scrollTo(0, 0));
expect(
	await page.evaluate(
		() => document.documentElement.scrollWidth <= window.innerWidth,
	),
).toBe(true);
expect(errors).toEqual([]);
await Bun.write(
	"evidence/browser-qa.json",
	JSON.stringify(
		{
			desktop: "1440x1100",
			mobile: "390x844",
			pageErrors: errors,
			checks: [
				"Native 7/7 both",
				"Clean 0/7 -> 7/7",
				"Degraded 1/7 -> 6/7",
				"Unknown fixture HTTP 400",
				"No horizontal mobile overflow",
				"Warnings and diagnostics expanded",
			],
			recording:
				"real Chromium browser session; overlay captions/cursor/key indicators",
		},
		null,
		2,
	),
);
const video = page.video();
await context.close();
await video?.saveAs("evidence/walkthrough.webm");
await browser.close();
