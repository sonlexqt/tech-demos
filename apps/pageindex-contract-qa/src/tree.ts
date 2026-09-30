import type { TreeNode } from "./types";

export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const out: TreeNode[] = [];
  const walk = (list: TreeNode[]) => {
    for (const node of list) {
      out.push(node);
      if (node.nodes?.length) walk(node.nodes);
    }
  };
  walk(nodes);
  return out;
}

export function findNode(nodes: TreeNode[], id: string): TreeNode | undefined {
  return flattenTree(nodes).find((n) => n.node_id === id);
}

export function pathToNode(nodes: TreeNode[], id: string): TreeNode[] {
  const stack: TreeNode[] = [];
  const search = (list: TreeNode[]): boolean => {
    for (const node of list) {
      stack.push(node);
      if (node.node_id === id) return true;
      if (node.nodes?.length && search(node.nodes)) return true;
      stack.pop();
    }
    return false;
  };
  search(nodes);
  return stack;
}

export function citationFor(path: TreeNode[]): string {
  if (!path.length) return "";
  const leaf = path[path.length - 1];
  const titles = path.map((n) => n.title);
  const page =
    leaf.start_index === leaf.end_index
      ? `p.${leaf.start_index}`
      : `pp.${leaf.start_index}–${leaf.end_index}`;
  return `${titles.join(" → ")} → ${page}`;
}

export function ancestorsOf(nodes: TreeNode[], id: string): Set<string> {
  return new Set(pathToNode(nodes, id).map((n) => n.node_id));
}

const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "for",
  "in",
  "on",
  "is",
  "are",
  "what",
  "how",
  "who",
  "can",
  "we",
  "do",
  "does",
  "vs",
  "versus",
]);

export function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

export function scoreNode(node: TreeNode, tokens: string[]): number {
  const hay = `${node.title} ${node.summary} ${node.excerpt} ${node.text}`
    .toLowerCase()
    .replace(/<[^>]+>/g, " ");
  let score = 0;
  for (const token of tokens) {
    if (!hay.includes(token)) continue;
    score += 2;
    if (node.title.toLowerCase().includes(token)) score += 6;
    if (node.excerpt.toLowerCase().includes(token)) score += 3;
  }
  return score;
}
