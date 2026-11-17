/**
 * Headless walkthrough for MOCK mode: fields appear, a drag correction,
 * interrupt form, ready-to-send run log. Writes media/*.png and media/*.mp4.
 */
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import puppeteer from "puppeteer-core";

const ROOT = join(import.meta.dir, "..");
const MEDIA = join(ROOT, "media");
const FRAMES = join(ROOT, ".capture-frames");
const BASE = process.env.CAPTURE_URL ?? "http://127.0.0.1:5173";

mkdirSync(MEDIA, { recursive: true });
rmSync(FRAMES, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? "/usr/bin/google-chrome-stable",
  headless: true,
  defaultViewport: { width: 1440, height: 900 },
  args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
page.setDefaultTimeout(40_000);

const session = await page.createCDPSession();
let frameN = 0;
session.on("Page.screencastFrame", async (frame) => {
  const n = frameN++;
  writeFileSync(join(FRAMES, `${String(n).padStart(4, "0")}.jpg`), Buffer.from(frame.data, "base64"));
  try {
    await session.send("Page.screencastFrameAck", { sessionId: frame.sessionId });
  } catch {
    /* stream closed */
  }
});

await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60_000 });
console.log("loaded");
await page.waitForSelector("#prepare-btn");
await page.waitForFunction(() => document.querySelectorAll(".page-wrap").length >= 1);
console.log("pages", await page.$$eval(".page-wrap", (els) => els.length));

await session.send("Page.startScreencast", {
  format: "jpeg",
  quality: 72,
  everyNthFrame: 1,
  maxWidth: 1440,
  maxHeight: 900,
});

await page.click("#prepare-btn");
console.log("clicked prepare");
await page.waitForFunction(() => document.querySelectorAll(".field-box").length >= 1, {
  timeout: 20_000,
});
console.log("first field");
await page.waitForFunction(() => document.querySelectorAll(".field-box").length >= 8, {
  timeout: 40_000,
});
console.log("fields", await page.$$eval(".field-box", (els) => els.length));
await page.waitForFunction(
  () => !document.getElementById("interrupt-card")?.classList.contains("hidden"),
  { timeout: 20_000 },
);
console.log("interrupt visible");

const signaturePage = await page.$('.page-wrap[data-page="6"]');
if (signaturePage) {
  await signaturePage.evaluate((el) => {
    const node = el as HTMLElement;
    const scroller = node.closest(".pages");
    if (scroller instanceof HTMLElement) {
      scroller.scrollTop = Math.max(0, node.offsetTop - 24);
    }
  });
}
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: join(MEDIA, "prepare-envelope.png"), type: "png" });

const page5 = await page.$('.page-wrap[data-page="5"]');
if (page5) await page5.evaluate((el) => el.scrollIntoView({ block: "center" }));
await new Promise((r) => setTimeout(r, 400));

const initials = await page.$('[data-field-id="priya-initials"]');
const page6 = await page.$('.page-wrap[data-page="6"]');
if (initials && page6) {
  const from = await initials.boundingBox();
  const to = await page6.boundingBox();
  if (from && to) {
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width * 0.62, to.y + to.height * 0.58, { steps: 20 });
    await page.mouse.up();
  }
}

await new Promise((r) => setTimeout(r, 500));
const approve = await page.waitForSelector("#approve-btn");
await approve?.evaluate((el) => el.scrollIntoView({ block: "center" }));
await new Promise((r) => setTimeout(r, 200));
await approve?.click();
console.log("clicked approve");
await page.waitForFunction(
  () => (document.querySelector("#score-panel")?.textContent ?? "").includes("Duration"),
  { timeout: 20_000 },
);
console.log("score", await page.$eval("#score-panel", (el) => el.textContent?.slice(0, 180)));
await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: join(MEDIA, "run-log.png"), type: "png" });

await session.send("Page.stopScreencast");
await browser.close();

const listed = Array.from(new Bun.Glob("*.jpg").scanSync({ cwd: FRAMES }));
if (listed.length < 8) {
  throw new Error(`Too few screencast frames: ${listed.length}`);
}

const ffmpeg = Bun.spawn(
  [
    "ffmpeg",
    "-y",
    "-framerate",
    "8",
    "-i",
    join(FRAMES, "%04d.jpg"),
    "-pix_fmt",
    "yuv420p",
    "-an",
    "-movflags",
    "+faststart",
    join(MEDIA, "prepare-envelope.mp4"),
  ],
  { stdout: "inherit", stderr: "inherit" },
);
const code = await ffmpeg.exited;
if (code !== 0) throw new Error(`ffmpeg failed: ${code}`);
rmSync(FRAMES, { recursive: true, force: true });
console.log(`Wrote media/ (${listed.length} frames)`);
