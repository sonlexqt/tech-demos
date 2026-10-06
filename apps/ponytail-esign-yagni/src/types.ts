export type RungId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type CodeFile = {
  path: string;
  code: string;
};

export type AgentChange = {
  files: CodeFile[];
  deps: string[];
  note: string;
};

export type Ticket = {
  id: string;
  number: number;
  title: string;
  request: string;
  alreadyInRepo: string[];
  neverCut: string[];
  normal: AgentChange;
  ponytail: AgentChange & {
    stopRung: RungId;
    stopLabel: string;
    skipped: string;
    addWhen: string;
  };
};

export type ReviewTag = "delete" | "stdlib" | "native" | "yagni" | "shrink";

export type ReviewFinding = {
  location: string;
  tag: ReviewTag;
  text: string;
};

export type ReviewResult = {
  source: "fixture" | "live";
  provider: "anthropic" | "openai" | null;
  findings: ReviewFinding[];
  netLines: number;
  leanAlready: boolean;
};

export type LlmStatus = {
  live: boolean;
  provider: "anthropic" | "openai" | null;
};
