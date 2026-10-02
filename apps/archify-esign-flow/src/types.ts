export type ComponentType =
  | "frontend"
  | "backend"
  | "database"
  | "cloud"
  | "security"
  | "messagebus"
  | "external";

export type Variant = "default" | "emphasis" | "security" | "dashed" | "return";

export type Card = {
  dot: string;
  title: string;
  items: string[];
};

export type WorkflowNode = {
  id: string;
  lane: string;
  col: number;
  type: ComponentType;
  label: string;
  sublabel?: string;
  tag?: string;
  width?: number;
};

export type WorkflowEdge = {
  id?: string;
  from: string;
  to: string;
  label?: string;
  variant?: Variant;
  role?: "main" | "branch" | "async" | "return" | "error";
  route?: string;
};

export type WorkflowIR = {
  schema_version: number;
  diagram_type: "workflow";
  meta: {
    title: string;
    subtitle?: string;
    output: string;
    animation?: string;
    visual_preset?: string;
    quality_profile?: string;
  };
  lanes: { id: string; label: string; variant?: string }[];
  phases?: { id: string; label: string; fromCol: number; toCol: number; variant?: string }[];
  groups?: {
    id: string;
    label: string;
    lane: string;
    fromCol: number;
    toCol: number;
    variant?: string;
  }[];
  mainPath?: string[];
  semanticChecks?: {
    allowedRoots?: string[];
    allowedTerminals?: string[];
    requiredEdges?: { from: string; to: string }[];
    requiredPaths?: { from: string; to: string }[];
  };
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  cards?: Card[];
};

export type SequenceParticipant = {
  id: string;
  type: ComponentType;
  label: string;
  sublabel?: string;
};

export type SequenceMessage = {
  id?: string;
  from: string;
  to: string;
  y: number;
  label: string;
  variant?: Variant;
  note?: string;
};

export type SequenceIR = {
  schema_version: number;
  diagram_type: "sequence";
  meta: {
    title: string;
    subtitle?: string;
    output: string;
    viewBox?: [number, number];
    column_fit?: "fixed" | "spread";
    animation?: string;
    visual_preset?: string;
    quality_profile?: string;
  };
  participants: SequenceParticipant[];
  segments?: { from: number; to: number; label: string }[];
  messages: SequenceMessage[];
  activations?: { participant: string; from: number; to: number; type?: ComponentType }[];
  cards?: Card[];
};

export type Relation = {
  id: string;
  from: string;
  to: string;
  label?: string;
  variant?: Variant;
};

export type ProbeOk = {
  ok: true;
  hops: Relation[];
  nodes: string[];
};

export type ProbeMiss = {
  ok: false;
  reason: string;
};

export type ProbeResult = ProbeOk | ProbeMiss;

export type DiagramKind = "workflow" | "sequence";
