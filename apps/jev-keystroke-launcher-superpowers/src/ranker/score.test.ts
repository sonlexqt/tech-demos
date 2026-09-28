import { describe, expect, test } from "bun:test";
import { FIXTURE_ITEMS, NOW } from "../catalog/fixtures";
import { rankWorkspace } from "./score";

describe("rankWorkspace", () => {
  test("classic download query ranks q3-board-deck first", () => {
    const hits = rankWorkspace("the pdf I just downloaded");
    expect(hits[0].item.id).toBe("q3-board-deck");
    expect(hits[0].reasons).toContain("downloaded most recently");
    expect(hits).toHaveLength(16);
  });

  test("preset chips lock expected winners", () => {
    expect(rankWorkspace("waiting on legal to sign")[0].item.id).toBe(
      "sow-legal-wait",
    );
    expect(rankWorkspace("MSA countersign")[0].item.id).toBe("msa-northwind");
    expect(rankWorkspace("expired signature requests")[0].item.id).toBe(
      "expired-nda",
    );
  });

  test("MSA template does not outrank msa-northwind", () => {
    const hits = rankWorkspace("MSA countersign");
    const template = hits.find((h) => h.item.id === "msa-template")!;
    const msa = hits.find((h) => h.item.id === "msa-northwind")!;
    expect(msa.score).toBeGreaterThan(template.score);
  });

  test("whitespace-only query ranks all items by recency", () => {
    const hits = rankWorkspace("   ");
    expect(hits).toHaveLength(16);
    expect(hits[0].item.id).toBe("q3-board-deck");
    expect(hits[0].reasons).toContain("recent activity");
  });

  test("equal score and modifiedAt sorts by id ascending", () => {
    const now = NOW;
    const a = {
      ...FIXTURE_ITEMS[0],
      id: "b-id",
      title: "Zed",
      kind: "doc" as const,
      tags: [],
      modifiedAt: "2026-01-01T00:00:00.000Z",
      downloadedAt: undefined,
      signature: undefined,
      subtitle: "x",
    };
    const b = { ...a, id: "a-id", title: "Aye" };
    const hits = rankWorkspace("zzzz-no-match", [a, b], now);
    expect(hits.map((h) => h.item.id)).toEqual(["a-id", "b-id"]);
  });
});
