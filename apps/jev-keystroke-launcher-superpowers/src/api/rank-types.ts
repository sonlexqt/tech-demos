import type { RankedHit } from "../catalog/types";

export type RankMode = "fixture" | "live";
export type RankSource = "jev" | "fixture";

export interface RankResponse {
  hits: RankedHit[];
  mode: RankMode;
  source: RankSource;
  note?: string;
}
