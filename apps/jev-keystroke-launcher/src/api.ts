import type { ModeResponse, RankResponse } from "./types";

export async function fetchMode(): Promise<ModeResponse> {
  const response = await fetch("/api/mode");
  if (!response.ok) throw new Error("Could not read ranking mode");
  return (await response.json()) as ModeResponse;
}

export async function rankQuery(query: string): Promise<RankResponse> {
  const response = await fetch("/api/rank", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const payload = (await response.json()) as RankResponse;
  if (!response.ok && !payload.items) {
    throw new Error(payload.error ?? "Rank failed");
  }
  return payload;
}
