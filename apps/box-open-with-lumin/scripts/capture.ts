import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer-core";

const BASE = process.env.DEMO_URL ?? "http://127.0.0.1:5173";
const OUT = new URL("../media/", import.meta.url).pathname;
const ART = "/opt/cursor/artifacts";

await mkdir(OUT, { recursive: true });
await mkdir(ART, { recursive: true }).catch(() => undefined);

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME ?? "/usr/bin/google-chrome-stable",
  headless: false,
  defaultViewport: { width: 1440, height: 900 },
  args: [
    "--no-sandbox",
    "--disable-gpu",
    "--window-size=1440,900",
    "--window-position=40,40",
  ],
});

const page = await browser.newPage();
page.on("pageerror", (err: unknown) => {
  console.error("pageerror", err instanceof Error ? err.message : err);
});
page.on("console", (msg) => {
  if (msg.type() === "error") console.error("console", msg.text());
});
await page.setViewport({ width: 1440, height: 900 });

async function shot(name: string): Promise<void> {
  const dests = [`${OUT}${name}`, `${ART}/${name}`];
  const buf = await page.screenshot({ type: "png", fullPage: false });
  await Promise.all(dests.map((p) => Bun.write(p, buf)));
  console.log("wrote", name, buf.byteLength);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

await page.goto(BASE, { waitUntil: "networkidle0" });
await page.waitForSelector("#files-body tr");
await sleep(800);

const firstRow = await page.$("#files-body tr");
if (!firstRow) throw new Error("no files");
const rowBox = await firstRow.boundingBox();
if (!rowBox) throw new Error("no row box");
await page.mouse.click(rowBox.x + 80, rowBox.y + 18, { button: "right" });
await page.waitForSelector("#context-menu.open");
await sleep(400);
await shot("box-open-with-menu.png");

await Promise.all([
  page.waitForNavigation({ waitUntil: "domcontentloaded" }),
  page.click('[data-action="open-lumin"]'),
]);
await page.waitForSelector("#pdf-canvas", { timeout: 20_000 });
await page.waitForFunction(() => {
  const c = document.querySelector("#pdf-canvas") as HTMLCanvasElement | null;
  return Boolean(c && c.width > 100);
});
await sleep(1200);

const overlay = await page.waitForSelector("#overlay");
const ob = await overlay!.boundingBox();
if (!ob) throw new Error("no overlay");

await page.click('[data-tool="highlight"]');
await page.mouse.move(ob.x + 90, ob.y + 210);
await page.mouse.down();
await page.mouse.move(ob.x + 420, ob.y + 268, { steps: 12 });
await page.mouse.up();
await sleep(400);

await page.click('[data-tool="sign"]');
await page.waitForSelector("#sig-modal.open");
await sleep(300);
const sig = await page.waitForSelector("#sig-canvas");
const sb = await sig!.boundingBox();
if (!sb) throw new Error("no sig canvas");
await page.mouse.move(sb.x + 40, sb.y + 90);
await page.mouse.down();
await page.mouse.move(sb.x + 90, sb.y + 40, { steps: 8 });
await page.mouse.move(sb.x + 160, sb.y + 100, { steps: 8 });
await page.mouse.move(sb.x + 240, sb.y + 50, { steps: 8 });
await page.mouse.move(sb.x + 320, sb.y + 95, { steps: 8 });
await page.mouse.up();
await page.click("#sig-use");
await sleep(400);
await page.mouse.click(ob.x + 170, ob.y + ob.height - 90);
await sleep(600);

await page.click("#save");
try {
  await page.waitForFunction(() => {
    const v = document.querySelector("#versions")?.textContent ?? "";
    const banner = document.querySelector("#banner")?.textContent ?? "";
    return v.includes("v2 current") || banner.toLowerCase().includes("saved") || banner.includes("412") || banner.toLowerCase().includes("fail");
  }, { timeout: 20_000 });
} catch (err) {
  const debug = await page.evaluate(() => ({
    url: location.href,
    banner: document.querySelector("#banner")?.textContent,
    versions: document.querySelector("#versions")?.textContent,
    meta: document.querySelector("#meta")?.textContent,
  }));
  console.error("save wait failed", debug);
  throw err;
}
await sleep(800);
await shot("lumin-saved-v2.png");
const versionsText = await page.$eval("#versions", (el) => el.textContent ?? "");
if (!versionsText.includes("v2")) {
  throw new Error(`expected v2 in version history, got: ${versionsText}`);
}

await sleep(1500);
await browser.close();
console.log("capture complete");
