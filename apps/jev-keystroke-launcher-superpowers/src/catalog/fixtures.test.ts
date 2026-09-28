import { describe, expect, test } from "bun:test";
import { FIXTURE_ITEMS, NOW } from "./fixtures";

describe("fixture catalog", () => {
  test("fixture catalog has 16 items and newest download is q3-board-deck", () => {
    expect(FIXTURE_ITEMS).toHaveLength(16);
    const downloads = FIXTURE_ITEMS.filter((i) => i.downloadedAt);
    const newest = downloads.reduce((a, b) =>
      a.downloadedAt! > b.downloadedAt! ? a : b,
    );
    expect(newest.id).toBe("q3-board-deck");
    expect(newest.downloadedAt).toBe("2026-09-28T10:15:00.000Z");
    expect(NOW.toISOString()).toBe("2026-09-28T12:00:00.000Z");
  });
});
