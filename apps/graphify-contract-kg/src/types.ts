export type NodeKind =
  | "party"
  | "document"
  | "clause"
  | "obligation"
  | "term"
  | "exhibit";

export type Confidence = "EXTRACTED" | "INFERRED" | "AMBIGUOUS";

export type FileType = "document" | "code" | "paper" | "image" | "rationale";

export interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  file_type: FileType;
  source_file: string;
  source_location?: string;
  community: string;
  excerpt: string;
  summary: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  confidence: Confidence;
  confidence_score: number;
  source_file: string;
  why: string;
}

export interface GraphPackage {
  directed: boolean;
  corpus: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface QueryStep {
  nodeId?: string;
  edgeId?: string;
  note: string;
}

export interface CannedQuery {
  id: string;
  chip: string;
  question: string;
  answer: string;
  steps: QueryStep[];
}

export interface FixtureDocument {
  id: string;
  title: string;
  filename: string;
  pages: number;
  body: string;
}

export interface LiveStatus {
  available: boolean;
  version: string | null;
  note: string;
}

export interface LaidOutNode extends GraphNode {
  x: number;
  y: number;
}

export interface PathHit {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
  currentNodeId?: string;
  currentEdgeId?: string;
}
