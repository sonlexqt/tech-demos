export type PasteTarget = "signer" | "company" | "address" | "email" | "clause";

export type Intent =
  | "signer_list"
  | "address_block"
  | "email_field"
  | "clause"
  | "mixed"
  | "junk";

export type Signer = {
  id: string;
  name: string;
  email: string;
  role: "signer" | "cc";
};

export type Workspace = {
  title: string;
  company: string;
  address: string;
  email: string;
  clause: string;
  signers: Signer[];
};

export type Proposal = {
  id: string;
  target: PasteTarget;
  label: string;
  value: string;
  name?: string;
  role?: Signer["role"];
  confidence: number;
  reason: string;
};

export type ModeInfo = {
  mode: "live" | "fixture";
  provider: "typesafe" | "ai-gateway" | null;
};

export type ClassifyResponse = {
  mode: "live" | "fixture";
  provider: "typesafe" | "ai-gateway" | null;
  model?: string;
  latency_ms: number;
  intent: Intent;
  intent_probabilities: Record<string, number>;
  intent_confidence: number;
  fit_score: number;
  fit_confidence: number;
  proposals: Proposal[];
  error?: string;
};

export type Candidates = {
  emails: string[];
  signers: Array<{ name: string; email: string }>;
  companies: string[];
  addresses: string[];
  clauses: string[];
};
