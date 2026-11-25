import { describe, expect, test } from "bun:test";
import {
  classifyFixtures,
  extractFeatures,
  looksHumanScore,
  scoreStrokeFile,
} from "../src/lib/forensics";
import { emptyStrokeFile } from "../src/lib/strokes";
import type { StrokeFile, StrokePoint } from "../src/lib/types";

function humanish(): StrokePoint[] {
  const pts: StrokePoint[] = [];
  let t = 0;
  for (let s = 0; s < 3; s++) {
    t += 80 + s * 70 + (s === 1 ? 180 : 0);
    const n = 40;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const jerk = 10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5;
      const dt = 6 + ((i * 7 + s * 3) % 11) + (i % 3);
      t += dt;
      pts.push({
        x: 40 + s * 120 + jerk * 80 + (i % 5) * 0.37,
        y: 80 + Math.sin(u * Math.PI) * 40 + (i % 4) * 0.21,
        t,
        down: true,
      });
    }
    t += 12 + s * 5;
    const last = pts[pts.length - 1];
    pts.push({ ...last, t, down: false });
  }
  return pts;
}

function generatedish(): StrokePoint[] {
  const pts: StrokePoint[] = [];
  let t = 0;
  for (let s = 0; s < 3; s++) {
    t += 80;
    for (let i = 0; i < 30; i++) {
      t += 12;
      pts.push({
        x: Math.round((30 + s * 100 + i * 4) * 5) / 5,
        y: Math.round(100 * 5) / 5,
        t,
        down: true,
      });
    }
    t += 36;
    const last = pts[pts.length - 1];
    pts.push({ ...last, t, down: false });
  }
  return pts;
}

describe("feature extraction", () => {
  test("counts strokes and pen-ups", () => {
    const f = extractFeatures(humanish());
    expect(f.strokeCount).toBe(3);
    expect(f.penUpCount).toBe(3);
    expect(f.pointCount).toBeGreaterThan(50);
  });

  test("generated clock is more regular and 12 ms-aligned", () => {
    const g = extractFeatures(generatedish());
    const h = extractFeatures(humanish());
    expect(g.dtRegularity).toBeGreaterThan(h.dtRegularity);
    expect(g.timeGridSnap).toBeGreaterThan(0.8);
    expect(h.timeGridSnap).toBeLessThan(g.timeGridSnap);
    expect(h.speedCv).toBeGreaterThan(g.speedCv);
  });
});

describe("looks-human score", () => {
  test("human kinematics score higher than plotter kinematics", () => {
    const h = looksHumanScore(extractFeatures(humanish()));
    const g = looksHumanScore(extractFeatures(generatedish()));
    expect(h).toBeGreaterThan(g);
    expect(h).toBeGreaterThan(0.5);
    expect(g).toBeLessThan(0.5);
  });

  test("scoreStrokeFile predicted labels match synthetic flag on toys", () => {
    const real = emptyStrokeFile({
      id: "toy-real",
      synthetic: false,
      points: humanish(),
    });
    const gen = emptyStrokeFile({
      id: "toy-gen",
      synthetic: true,
      points: generatedish(),
    });
    expect(scoreStrokeFile(real).predicted).toBe("human");
    expect(scoreStrokeFile(gen).predicted).toBe("generated");
  });
});

describe("classifier report", () => {
  test("perfect on the toy pair", () => {
    const files: StrokeFile[] = [
      emptyStrokeFile({
        id: "a-real",
        volunteerId: "a",
        synthetic: false,
        points: humanish(),
      }),
      emptyStrokeFile({
        id: "a-gen",
        volunteerId: "a",
        synthetic: true,
        points: generatedish(),
      }),
    ];
    const r = classifyFixtures(files);
    expect(r.accuracy).toBe(1);
    expect(r.truePositives).toBe(1);
    expect(r.trueNegatives).toBe(1);
    expect(r.notes.length).toBeGreaterThan(0);
  });
});
