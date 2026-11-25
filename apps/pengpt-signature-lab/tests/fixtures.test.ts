import { describe, expect, test } from "bun:test";
import { classifyFixtures, scoreStrokeFile } from "../src/lib/forensics";
import { isStrokeFile } from "../src/lib/strokes";
import type { FixtureManifest, StrokeFile } from "../src/lib/types";

const root = `${import.meta.dir}/../public/fixtures`;

async function readJson(name: string): Promise<unknown> {
  return JSON.parse(await Bun.file(`${root}/${name}`).text());
}

describe("shipped fixtures", () => {
  test("manifest lists four volunteers and real PenGPT generation", async () => {
    const m = (await readJson("manifest.json")) as FixtureManifest;
    expect(m.volunteers.length).toBe(4);
    expect(m.generatedWithPengpt).toBe(true);
  });

  test("every generated file is synthetic and watermarked in SVG", async () => {
    const m = (await readJson("manifest.json")) as FixtureManifest;
    for (const v of m.volunteers) {
      const gen = (await readJson(`${v.generatedId}.json`)) as StrokeFile;
      const real = (await readJson(`${v.realId}.json`)) as StrokeFile;
      expect(isStrokeFile(gen)).toBe(true);
      expect(isStrokeFile(real)).toBe(true);
      expect(gen.synthetic).toBe(true);
      expect(real.synthetic).toBe(false);
      expect(gen.points.length).toBeGreaterThan(20);
      expect(real.points.length).toBeGreaterThan(20);
      const svg = await Bun.file(`${root}/${v.generatedId}.svg`).text();
      expect(svg).toContain("SYNTHETIC");
    }
  });

  test("classifier separates the four volunteer pairs", async () => {
    const m = (await readJson("manifest.json")) as FixtureManifest;
    const files: StrokeFile[] = [];
    for (const v of m.volunteers) {
      files.push((await readJson(`${v.realId}.json`)) as StrokeFile);
      files.push((await readJson(`${v.generatedId}.json`)) as StrokeFile);
    }
    const report = classifyFixtures(files);
    expect(files.length).toBe(8);
    expect(report.accuracy).toBeGreaterThanOrEqual(0.75);
    for (const v of m.volunteers) {
      const real = files.find((f) => f.id === v.realId)!;
      const gen = files.find((f) => f.id === v.generatedId)!;
      expect(scoreStrokeFile(real).looksHuman).toBeGreaterThan(
        scoreStrokeFile(gen).looksHuman,
      );
    }
  });
});
