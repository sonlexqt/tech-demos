export type TreeNode = {
  title: string;
  node_id: string;
  start_index: number;
  end_index: number;
  summary: string;
  excerpt: string;
  text: string;
  nodes?: TreeNode[];
};

export type PageIndexTree = {
  doc_name: string;
  doc_description: string;
  structure: TreeNode[];
};

export type DocumentMeta = {
  title: string;
  shortTitle: string;
  parties: { name: string; role: string }[];
  effectiveDate: string;
  pageCount: number;
  status: string;
  agreementId: string;
};

export type WalkStep = {
  node_id: string;
  reason: string;
};

export type CannedQuery = {
  id: string;
  label: string;
  question: string;
  aliases: string[];
  steps: WalkStep[];
  answer: string;
  highlight_node_id: string;
};

export type QueryResult = {
  question: string;
  cannedId?: string;
  steps: WalkStep[];
  answer: string;
  highlightNode: TreeNode;
  path: TreeNode[];
  citation: string;
};
