export type ColorToken = {
  role: string;
  hex: string;
  cssVar: string;
};

export type DesignSystem = {
  project: string;
  generated: string;
  category: string;
  colors: ColorToken[];
  colorNotes: string;
  headingFont: string;
  bodyFont: string;
  typeMood: string;
  googleFontsUrl: string;
  style: string;
  styleKeywords: string;
  patternName: string;
  conversion: string;
  cta: string;
  sections: string;
  keyEffects: string;
  antiPatterns: string[];
  checklist: string[];
};

export type IndustryRow = {
  id: number;
  category: string;
  pattern: string;
  antiPatterns: string[];
};

export type IndustryFilters = {
  skill: string;
  source: string;
  note: string;
  rows: IndustryRow[];
};

export type RuleId =
  | "emoji"
  | "iconset"
  | "pointer"
  | "hover"
  | "contrast"
  | "focus"
  | "motion"
  | "responsive"
  | "navbar"
  | "scroll"
  | "purple";

export type AuditRule = {
  id: RuleId;
  label: string;
  hint: string;
};
