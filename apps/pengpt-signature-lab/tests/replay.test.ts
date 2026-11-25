import { describe, expect, test } from "bun:test";
import { replayDuration, visibleAt } from "../src/lib/replay";
import type { StrokePoint } from "../src/lib/types";

const pts: StrokePoint[] = [
  { x: 0, y: 0, t: 100, down: true },
  { x: 10, y: 0, t: 200, down: true },
  { x: 20, y: 0, t: 300, down: true },
];

describe("replay clock", () => {
  test("duration uses recorded timestamps", () => {
    expect(replayDuration(pts)).toBe(200);
  });

  test("t=0 shows the first sample", () => {
    const vis = visibleAt(pts, 0);
    expect(vis.length).toBe(1);
    expect(vis[0].x).toBe(0);
  });

  test("interpolates the leading tip", () => {
    const vis = visibleAt(pts, 50);
    expect(vis.length).toBe(2);
    expect(vis[1].x).toBe(5);
    expect(vis[1].down).toBe(true);
  });

  test("past the end shows every point", () => {
    expect(visibleAt(pts, 999).length).toBe(3);
  });
});
