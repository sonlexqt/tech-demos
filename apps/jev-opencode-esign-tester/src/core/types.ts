export type SignStatus = "draft" | "ready" | "sent" | "declined" | "blocked";

export type TargetId =
  | "title"
  | "signer-name"
  | "signer-email"
  | "message"
  | "send"
  | "decline"
  | "status"
  | "error-banner"
  | "sig-field";

export type SignState = {
  title: string;
  message: string;
  signerName: string;
  signerEmail: string;
  status: SignStatus;
  error: string | null;
};

export type ClickAction = {
  id: string;
  kind: "click";
  target: TargetId;
  label: string;
};

export type TypeAction = {
  id: string;
  kind: "type";
  target: TargetId;
  value: string;
  label: string;
};

export type AssertStatusAction = {
  id: string;
  kind: "assert-status";
  expected: SignStatus;
  label: string;
  target: "status";
};

export type ExpectErrorAction = {
  id: string;
  kind: "expect-error";
  match: string;
  label: string;
  target: "error-banner";
};

export type PlanAction =
  | ClickAction
  | TypeAction
  | AssertStatusAction
  | ExpectErrorAction;

export type JevPrimitive = "choice" | "score";

export type PlanStep = {
  id: string;
  title: string;
  intent: string;
  primitive: JevPrimitive;
  expectedActionId: string;
  actionSpace: PlanAction[];
};

export type TestPlan = {
  id: string;
  title: string;
  summary: string;
  steps: PlanStep[];
};

export type JevMode = "fixture" | "live";

export type Decision = {
  mode: JevMode;
  primitive: JevPrimitive;
  chosenActionId: string;
  confidence: number;
  score?: number;
  probabilities?: Record<string, number>;
  note?: string;
};

export type StepLog = {
  stepId: string;
  stepTitle: string;
  chosenActionId: string;
  expectedActionId: string;
  chosenLabel: string;
  passed: boolean;
  message: string;
  decision: Decision;
  highlight: TargetId | null;
};

export type DecideRequest = {
  state: {
    intent: string;
    primitive: JevPrimitive;
    ui: {
      title: string;
      signerName: string;
      signerEmail: string;
      message: string;
      status: SignStatus;
      error: string | null;
    };
    actionSpace: { id: string; kind: string; label: string }[];
  };
  questions: Record<string, JevQuestion>;
};

export type JevQuestion =
  | {
      type: "choice";
      instructions: string;
      criteria: Record<string, string>;
    }
  | {
      type: "score";
      instructions: string;
      criteria: string[];
    }
  | {
      type: "noul";
      instructions: string;
    };

export const SCORE_LEVELS = [
  "does not hold",
  "weak or partial",
  "likely holds",
  "holds clearly",
] as const;

export const SCORE_PASS_THRESHOLD = 2;
