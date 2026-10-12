export type Verdict = "match" | "miss" | "unknown";

export type AccuracyCheck = {
  id: string;
  claim: string;
  verdict: Verdict;
  rea: string;
  source: string;
};

export type FlowStep = {
  id: string;
  title: string;
  claim: string;
  evidence: string[];
  source_file: string;
};

export type SigningReport = {
  title: string;
  subtitle: string;
  mode: string;
  disclaimer: string;
  rea: {
    package: string;
    skill: string;
    operations: string[];
    analyze_evidence_id: string;
    inspect_evidence_id: string;
    provider: string;
    authority: string;
    confidence: string;
    graph_id: string;
    semantic_graph_id: string;
  };
  flow: FlowStep[];
  limitations: string[];
  notes: string[];
};

export type EvidenceLiteral = {
  node_id: unknown;
  label: unknown;
  value: unknown;
};

export type EvidenceIndex = {
  rea_package: string;
  analyze_evidence_id: string;
  inspect_evidence_id: string;
  statistics: Record<string, unknown>;
  graph: {
    graph_id: string;
    node_count: number;
    edge_count: number;
    kinds: Record<string, number>;
    exports: Array<{ node_id: unknown; key: string; namespace: unknown }>;
  };
  semantic: {
    graph_id: string;
    node_count: number;
    relation_count: number;
    literals: EvidenceLiteral[];
    functions: Array<{ node_id: unknown; name: unknown }>;
    property_slots: string[];
    expression_labels: string[];
  };
  traces: Array<{
    file: string;
    evidence_id: unknown;
    seed: unknown;
    coverage_status: unknown;
    seed_matches: unknown;
  }>;
};
