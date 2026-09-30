import { cannedQueries } from "./data/qa";
import { tree } from "./data/contract";
import type { CannedQuery, QueryResult, TreeNode, WalkStep } from "./types";
import { citationFor, findNode, pathToNode, scoreNode, tokenize } from "./tree";

function resultFromCanned(query: CannedQuery, question: string): QueryResult {
  const highlight = findNode(tree, query.highlight_node_id);
  if (!highlight) {
    throw new Error(`Missing highlight node ${query.highlight_node_id}`);
  }
  const path = pathToNode(tree, highlight.node_id);
  return {
    question,
    cannedId: query.id,
    steps: query.steps,
    answer: query.answer,
    highlightNode: highlight,
    path,
    citation: citationFor(path),
  };
}

export function matchCanned(question: string): CannedQuery | undefined {
  const q = question.trim().toLowerCase();
  if (!q) return undefined;
  const exact = cannedQueries.find(
    (c) => c.question.toLowerCase() === q || c.label.toLowerCase() === q,
  );
  if (exact) return exact;
  let best: { canned: CannedQuery; score: number } | undefined;
  for (const canned of cannedQueries) {
    let score = 0;
    if (q.includes(canned.label.toLowerCase())) score += 5;
    for (const alias of canned.aliases) {
      if (q.includes(alias.toLowerCase())) score += alias.length > 8 ? 4 : 2;
    }
    if (!best || score > best.score) best = { canned, score };
  }
  return best && best.score >= 4 ? best.canned : undefined;
}

function inferSteps(path: TreeNode[], tokens: string[]): WalkStep[] {
  return path.map((node, i) => {
    const why =
      i === 0
        ? `Scanning the tree index — “${node.title}” is the best top-level match for [${tokens.slice(0, 4).join(", ")}].`
        : i === path.length - 1
          ? `Landing on “${node.title}” (node ${node.node_id}) because the excerpt and body discuss the asked terms.`
          : `Descending into “${node.title}” to refine the clause (pages ${node.start_index}–${node.end_index}).`;
    return { node_id: node.node_id, reason: why };
  });
}

export function answerQuestion(question: string): QueryResult | undefined {
  const trimmed = question.trim();
  if (!trimmed) return undefined;
  const canned = matchCanned(trimmed);
  if (canned) return resultFromCanned(canned, canned.question);

  const tokens = tokenize(trimmed);
  if (!tokens.length) return undefined;

  const flat = flattenAll(tree);
  let winner: { node: TreeNode; score: number } | undefined;
  for (const node of flat) {
    const score = scoreNode(node, tokens);
    if (score <= 0) continue;
    if (!winner || score > winner.score) winner = { node, score };
  }
  if (!winner || winner.score < 4) return undefined;

  const path = pathToNode(tree, winner.node.node_id);
  return {
    question: trimmed,
    steps: inferSteps(path, tokens),
    answer: `Closest clause in the fixture tree: ${winner.node.summary}`,
    highlightNode: winner.node,
    path,
    citation: citationFor(path),
  };
}

function flattenAll(nodes: TreeNode[]): TreeNode[] {
  const out: TreeNode[] = [];
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      out.push(n);
      if (n.nodes?.length) walk(n.nodes);
    }
  };
  walk(nodes);
  return out;
}

export function liveKeysPresent(): boolean {
  const pageindex = import.meta.env.VITE_PAGEINDEX_API_KEY as string | undefined;
  const openai = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  return Boolean(pageindex?.trim() && openai?.trim());
}
