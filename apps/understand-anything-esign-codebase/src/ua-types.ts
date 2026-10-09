export type NodeType =
  | "file"
  | "function"
  | "class"
  | "module"
  | "concept"
  | "config"
  | "document"
  | "service"
  | "table"
  | "endpoint"
  | "pipeline"
  | "schema"
  | "resource";

export type EdgeType =
  | "imports"
  | "exports"
  | "contains"
  | "inherits"
  | "implements"
  | "calls"
  | "subscribes"
  | "publishes"
  | "middleware"
  | "reads_from"
  | "writes_to"
  | "transforms"
  | "validates"
  | "depends_on"
  | "tested_by"
  | "configures"
  | "related"
  | "similar_to"
  | "deploys"
  | "serves"
  | "provisions"
  | "triggers"
  | "migrates"
  | "documents"
  | "routes"
  | "defines_schema";

export interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  filePath?: string;
  lineRange?: [number, number];
  summary: string;
  tags: string[];
  complexity: "simple" | "moderate" | "complex";
  languageNotes?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  direction: "forward" | "backward" | "bidirectional";
  description?: string;
  weight: number;
}

export interface Layer {
  id: string;
  name: string;
  description: string;
  nodeIds: string[];
}

export interface TourStep {
  order: number;
  title: string;
  description: string;
  nodeIds: string[];
  languageLesson?: string;
}

export interface KnowledgeGraph {
  version: string;
  kind?: "codebase" | "knowledge" | "design";
  project: {
    name: string;
    languages: string[];
    frameworks: string[];
    description: string;
    analyzedAt: string;
    gitCommitHash: string;
  };
  nodes: GraphNode[];
  edges: GraphEdge[];
  layers: Layer[];
  tour: TourStep[];
}

export interface SampleDiff {
  id: string;
  title: string;
  command: string;
  baseBranch: string;
  changedFiles: string[];
  summary: string;
  patch: string;
  riskNote: string;
}

export interface DiffOverlay {
  version: string;
  baseBranch: string;
  generatedAt: string;
  changedFiles: string[];
  changedNodeIds: string[];
  affectedNodeIds: string[];
}

export interface ImpactReport {
  overlay: DiffOverlay;
  changed: GraphNode[];
  affected: GraphNode[];
  tests: GraphNode[];
  layers: Layer[];
  risk: "low" | "medium" | "high";
  reasons: string[];
}

export interface ExplainReport {
  node: GraphNode;
  layer?: Layer;
  incoming: Array<{ edge: GraphEdge; node: GraphNode }>;
  outgoing: Array<{ edge: GraphEdge; node: GraphNode }>;
  contained: GraphNode[];
  source?: { path: string; text: string; start: number; end: number };
}
