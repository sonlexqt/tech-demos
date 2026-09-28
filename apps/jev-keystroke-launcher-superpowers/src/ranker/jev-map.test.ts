import { describe, expect, test } from "bun:test";
import { FIXTURE_ITEMS } from "../catalog/fixtures";
import { mapJevProbabilities } from "./jev-map";
import { rankWorkspace } from "./score";

describe("mapJevProbabilities", () => {
  test("highest probability wins and unknown ids do not throw", () => {
    const fixtureHits = rankWorkspace("the pdf I just downloaded");
    const hits = mapJevProbabilities(
      FIXTURE_ITEMS,
      { "msa-northwind": 0.9, "ghost-id": 0.8 },
      fixtureHits,
    );
    expect(hits[0].item.id).toBe("msa-northwind");
    expect(hits).toHaveLength(16);
    expect(hits.find((h) => h.item.id === "q3-board-deck")!.score).toBe(0);
  });
});
