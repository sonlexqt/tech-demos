/**
 * Headed walkthrough for screenshots + the screen recording.
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const out = process.env.SHOT_DIR ?? "/opt/cursor/artifacts/screenshots";
mkdirSync(out, { recursive: true });

const headed = process.env.HEADED === "1";
const browser = await chromium.launch({
  headless: !headed,
  args: headed ? ["--start-maximized"] : [],
});
const page = await browser.newPage({ viewport: headed ? null : { width: 1280, height: 800 } });
await page.goto("http://127.0.0.1:5173/");
await page.waitForSelector("text=Two-signer desk");
await page.screenshot({ path: join(out, "01-home.png"), fullPage: true });

await page.getByRole("button", { name: "Open envelope" }).click();
await page.waitForSelector("canvas");
await page.waitForTimeout(400);
await page.getByRole("button", { name: "Add signature field" }).click();
await page.waitForSelector('[data-testid="signature-field"]');
await page.screenshot({ path: join(out, "02-prepare-field.png"), fullPage: true });

await page.getByRole("button", { name: "Send for signing" }).click();
await page.getByLabel("Type your signature").fill("Ada Lovelace");
await page.getByRole("button", { name: "Finish" }).click();
await page.waitForSelector("text=Awaiting countersignature");
await page.screenshot({ path: join(out, "03-awaiting-countersign.png"), fullPage: true });

await page.getByRole("button", { name: "Countersign as Bob Signer" }).click();
await page.getByLabel("Type your signature").fill("Bob Signer");
await page.getByRole("button", { name: "Finish" }).click();
await page.waitForSelector("text=Completed");
await page.screenshot({ path: join(out, "04-completed.png"), fullPage: true });

await page.goto("http://127.0.0.1:5173/#drift");
await page.getByRole("button", { name: "Reset demo" }).click();
await page.getByRole("button", { name: "Open envelope" }).click();
await page.waitForSelector("text=Marks");
await page.waitForSelector("canvas");
await page.waitForTimeout(500);
await page.screenshot({ path: join(out, "05-drift-marks.png"), fullPage: true });

await page.goto("http://127.0.0.1:5173/results");
await page.waitForSelector("text=Cached replay");
await page.waitForTimeout(300);
await page.screenshot({ path: join(out, "06-results.png"), fullPage: true });

console.log(`wrote screenshots to ${out}`);
await page.waitForTimeout(headed ? 800 : 0);
await browser.close();
