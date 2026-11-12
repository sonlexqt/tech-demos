/** Request/response types matching the Gemini Decisions API (v1beta). */

export const DECISIONS_MODEL = "gemini-decision-1";
export const DECISIONS_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/decisions";

export type MediaResolution = "low" | "medium" | "high" | "ultra_high";

export type TextContent = { type: "text"; text: string };
export type ImageContent = {
  type: "image";
  data?: string;
  uri?: string;
  mime_type: string;
  resolution?: MediaResolution;
};
export type AudioContent = {
  type: "audio";
  data?: string;
  uri?: string;
  mime_type: string;
};
export type VideoContent = {
  type: "video";
  data?: string;
  uri?: string;
  mime_type: string;
  resolution?: Exclude<MediaResolution, "ultra_high">;
};
export type DocumentContent = {
  type: "document";
  data?: string;
  uri?: string;
  mime_type: "application/pdf";
};

export type ContentBlock =
  | TextContent
  | ImageContent
  | AudioContent
  | VideoContent
  | DocumentContent;

export type DecisionsInput = string | ContentBlock | ContentBlock[];

export type NoulQuestion = {
  type: "noul";
  instructions: string;
  criteria?: {
    true_description: string;
    false_description: string;
  };
};

export type ChoiceQuestion = {
  type: "choice";
  instructions: string;
  criteria: Record<string, string>;
};

export type ScoreQuestion = {
  type: "score";
  instructions: string;
  criteria: string[];
};

export type Question = NoulQuestion | ChoiceQuestion | ScoreQuestion;

export type NoulAnswer = {
  type: "noul";
  noul: number;
  confidence: number;
};

export type ChoiceAnswer = {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
};

export type ScoreAnswer = {
  type: "score";
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
  confidence: number;
};

export type Answer = NoulAnswer | ChoiceAnswer | ScoreAnswer;

export type Usage = {
  total_input_tokens: number;
  input_tokens_by_modality: Array<{ modality: string; tokens: number }>;
  total_output_tokens: number;
  total_tokens: number;
};

export type DecisionsRequest = {
  model: typeof DECISIONS_MODEL;
  input: DecisionsInput;
  questions: Record<string, Question>;
};

export type DecisionsResponse = {
  answers: Record<string, Answer>;
  usage: Usage;
};

export type ExpectedNoul = { type: "noul"; yes: boolean };
export type ExpectedChoice = { type: "choice"; choice: string };
export type ExpectedScore = { type: "score"; level: number };
export type ExpectedAnswer = ExpectedNoul | ExpectedChoice | ExpectedScore;

export type GroundTruth = {
  id: string;
  title: string;
  documentType: "msa" | "nda";
  planted: boolean;
  expected: Record<string, ExpectedAnswer>;
  plantedIssues: string[];
};

export type AdapterMode = "mock" | "live";

export type Verdict = "pass" | "fail" | "human" | "na";

export type ClassifiedCheck = {
  id: string;
  label: string;
  group: string;
  hint: string;
  verdict: Verdict;
  answer: Answer;
  expected?: ExpectedAnswer;
};
