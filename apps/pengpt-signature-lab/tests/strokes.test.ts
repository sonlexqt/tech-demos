import { describe, expect, test } from "bun:test";
import {
  durationMs,
  emptyStrokeFile,
  isStrokeFile,
  parseStrokeFile,
  splitStrokes,
  strokeFileToSvg,
  toSvgPath,
} from "../src/lib/strokes";
import { STROKE_SCHEMA, type StrokePoint } from "../src/lib/types";

const line: StrokePoint[] = [
  { x: 0, y: 0, t: 0, down: true },
  { x: 10, y: 0, t: 20, down: true },
  { x: 10, y: 0, t: 25, down: false },
  { x: 20, y: 5, t: 80, down: true },
  { x: 30, y: 5, t: 100, down: true },
];

describe("stroke schema", () => {
  test("emptyStrokeFile is valid v1", () => {
    const f = emptyStrokeFile({ id: "t", volunteerId: "v" });
    expect(isStrokeFile(f)).toBe(true);
    expect(f.schema).toBe(STROKE_SCHEMA);
    expect(f.synthetic).toBe(false);
  });

  test("parseStrokeFile rejects junk", () => {
    expect(() => parseStrokeFile("{}")).toThrow();
    expect(() => parseStrokeFile("[]")).toThrow();
  });

  test("round-trip JSON", () => {
    const f = emptyStrokeFile({ points: line, synthetic: true, id: "gen" });
    const parsed = parseStrokeFile(JSON.stringify(f));
    expect(parsed.points.length).toBe(5);
    expect(parsed.synthetic).toBe(true);
  });
});

describe("splitStrokes", () => {
  test("splits on pen-up", () => {
    const s = splitStrokes(line);
    expect(s.length).toBe(2);
    expect(s[0].length).toBe(2);
    expect(s[1].length).toBe(2);
  });

  test("trailing down run counts", () => {
    const s = splitStrokes(line.slice(0, 2));
    expect(s.length).toBe(1);
  });
});

describe("timing helpers", () => {
  test("duration is last minus first", () => {
    expect(durationMs(line)).toBe(100);
  });

  test("svg path has two moves", () => {
    const d = toSvgPath(line);
    expect(d.startsWith("M")).toBe(true);
    expect(d.split("M").length - 1).toBe(2);
  });

  test("generated SVG carries SYNTHETIC", () => {
    const f = emptyStrokeFile({ points: line, synthetic: true });
    expect(strokeFileToSvg(f)).toContain("SYNTHETIC");
  });
});
