export type StageId = "define" | "plan" | "build" | "verify" | "review" | "ship";
export type TabId = "lifecycle" | "compare";
export type PersonaId = "all" | "staff" | "qa" | "security" | "webperf";
export type Severity = "Critical" | "Required" | "Nit" | "Optional" | "FYI";

export interface Stage {
  id: StageId;
  index: number;
  phase: string;
  command: string;
  skill: string;
  skillFile: string;
  artifact: string;
  blurb: string;
}

export interface Rationalization {
  id: string;
  stage: StageId | "any";
  excuse: string;
  skill: string;
  rebuttal: string;
  evidence: string[];
}

export interface ReviewComment {
  id: string;
  persona: Exclude<PersonaId, "all">;
  personaLabel: string;
  axis: "Correctness" | "Readability" | "Architecture" | "Security" | "Performance";
  severity: Severity;
  location: string;
  body: string;
  fix?: string;
}

export interface CompareRow {
  axis: string;
  agentSkills: string;
  superpowers: string;
}
