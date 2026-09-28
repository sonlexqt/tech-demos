import { describe, expect, mock, test } from "bun:test";
import { handleRank, resolveRankMode } from "./jev-proxy";

describe("jev proxy handlers", () => {
  test("empty JEV_API_KEY is fixture mode and uses local ranker", async () => {
    expect(resolveRankMode({})).toBe("fixture");
    const res = await handleRank("the pdf I just downloaded", {}, fetch);
    expect(res.hits[0].item.id).toBe("q3-board-deck");
    expect(res.source).toBe("fixture");
  });

  test("live key posts to TypeSafe and maps probabilities", async () => {
    const fetchImpl = mock(async () =>
      new Response(
        JSON.stringify({
          answers: {
            best_item: {
              type: "choice",
              choice: "msa-northwind",
              probabilities: { "msa-northwind": 1 },
            },
          },
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;
    const res = await handleRank(
      "MSA countersign",
      { JEV_API_KEY: "test-key" },
      fetchImpl,
    );
    expect(res.source).toBe("jev");
    expect(res.hits[0].item.id).toBe("msa-northwind");
  });
});
