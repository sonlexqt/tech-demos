import { describe, expect, test } from "bun:test";
import { rankCatalog } from "./fixtureRanker";

function topIds(query: string, n = 3): string[] {
  return rankCatalog(query)
    .slice(0, n)
    .map((item) => item.id);
}

describe("fixture intent ranking", () => {
  test("the pdf I just downloaded → newest downloaded PDF", () => {
    const ranked = rankCatalog("the pdf I just downloaded");
    expect(ranked[0]?.id).toBe("pdf-q3-board-deck");
    expect(ranked[0]?.kind).toBe("pdf");
    expect(ranked.slice(0, 4).every((item) => item.kind === "pdf")).toBe(true);
  });

  test("waiting on legal to sign → Acme MSA countersign", () => {
    expect(topIds("waiting on legal to sign")[0]).toBe("sig-msa-countersign");
  });

  test("MSA countersign → signature request, not the executed PDF or template", () => {
    expect(topIds("MSA countersign")[0]).toBe("sig-msa-countersign");
  });

  test("expired signature requests → expired items first", () => {
    const top = topIds("expired signature requests", 2);
    expect(top).toContain("sig-dpa-expired");
    expect(top).toContain("sig-partner-expired");
  });
});
