export type Severity = "error" | "warning" | "advisory";
export type Category = "slop" | "quality";
export type DetectSource = "cli" | "fixture";

export type CliFinding = {
  antipattern: string;
  name: string;
  description: string;
  severity: Severity;
  category: Category;
  file: string;
  line: number;
  snippet: string;
  advisory?: boolean;
};

export type DetectResponse = {
  source: DetectSource;
  exit: number;
  findings: CliFinding[];
  note?: string;
};

export type CommandId =
  | "craft"
  | "init"
  | "document"
  | "extract"
  | "shape"
  | "critique"
  | "audit"
  | "polish"
  | "bolder"
  | "quieter"
  | "distill"
  | "harden"
  | "onboard"
  | "animate"
  | "colorize"
  | "typeset"
  | "layout"
  | "delight"
  | "overdrive"
  | "clarify"
  | "adapt"
  | "optimize"
  | "live"
  | "generate";

export type CommandDef = {
  id: CommandId;
  summary: string;
  layer: "deterministic" | "llm" | "setup" | "live";
};

export type RuleMeta = {
  command: CommandId;
  element: string;
  whyEsign: string;
  fixLabel: string;
};

export type DemoFinding = {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  category: Category;
  command: CommandId;
  element: string;
  whyEsign: string;
  fixLabel: string;
  instances: { snippet: string }[];
};
