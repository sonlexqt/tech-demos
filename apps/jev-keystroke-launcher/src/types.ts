export type ItemKind = "pdf" | "doc" | "signature" | "folder" | "template";

export type SignatureStatus =
  | "draft"
  | "waiting"
  | "completed"
  | "expired"
  | "voided";

export type CatalogItem = {
  id: string;
  kind: ItemKind;
  title: string;
  subtitle: string;
  aliases: string[];
  tags: string[];
  modified_at: string;
  downloaded_at?: string;
  status?: SignatureStatus;
  parties?: string[];
  owner: string;
};

export type RankedItem = CatalogItem & {
  score: number;
  reasons: string[];
};

export type RankMode = "fixture" | "live";

export type RankResponse = {
  mode: RankMode;
  provider: string | null;
  model: string;
  query: string;
  latency_ms: number;
  items: RankedItem[];
  error?: string;
};

export type ModeResponse = {
  mode: RankMode;
  provider: string | null;
};

export type PresetQuery = {
  label: string;
  query: string;
};
