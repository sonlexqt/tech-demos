import type { RankMode, RankResponse } from "./rank-types";

export async function fetchRankMode(): Promise<RankMode> {
  const response = await fetch("/api/rank-mode");
  if (!response.ok) {
    return "fixture";
  }
  const body = (await response.json()) as { mode?: RankMode };
  return body.mode === "live" ? "live" : "fixture";
}

export async function fetchRank(query: string): Promise<RankResponse> {
  const response = await fetch("/api/rank", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    throw new Error(`rank failed: ${response.status}`);
  }
  return (await response.json()) as RankResponse;
}
