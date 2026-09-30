import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { meta, pageIndexDocument, tree } from "../src/data/contract";
import { cannedQueries } from "../src/data/qa";
import type { TreeNode } from "../src/types";
import { findNode } from "../src/tree";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "fixtures");
mkdirSync(outDir, { recursive: true });

function stripHtml(html: string): string {
  return html
    .replace(/<\/p>/g, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toMarkdown(nodes: TreeNode[], depth = 2): string {
  return nodes
    .map((node) => {
      const heading = "#".repeat(Math.min(depth, 6));
      const pages =
        node.start_index === node.end_index
          ? `p. ${node.start_index}`
          : `pp. ${node.start_index}–${node.end_index}`;
      const body = stripHtml(node.text);
      const kids = node.nodes?.length ? `\n\n${toMarkdown(node.nodes, depth + 1)}` : "";
      return `${heading} ${node.title}\n\n*node_id \`${node.node_id}\` · ${pages}*\n\n${body}${kids}`;
    })
    .join("\n\n");
}

for (const q of cannedQueries) {
  if (!findNode(tree, q.highlight_node_id)) {
    throw new Error(`Canned query ${q.id} missing node ${q.highlight_node_id}`);
  }
  for (const step of q.steps) {
    if (!findNode(tree, step.node_id)) {
      throw new Error(`Canned query ${q.id} missing walk node ${step.node_id}`);
    }
  }
}

const slimTree = {
  doc_name: pageIndexDocument.doc_name,
  doc_description: pageIndexDocument.doc_description,
  structure: pageIndexDocument.structure,
};

writeFileSync(join(outDir, "pageindex-tree.json"), `${JSON.stringify(slimTree, null, 2)}\n`);
writeFileSync(join(outDir, "canned-qa.json"), `${JSON.stringify(cannedQueries, null, 2)}\n`);

const md = `# ${meta.title}

- **Agreement ID:** ${meta.agreementId}
- **Parties:** ${meta.parties.map((p) => `${p.name} (${p.role})`).join("; ")}
- **Effective date:** ${meta.effectiveDate}
- **Pages:** ${meta.pageCount}
- **Status:** ${meta.status}

> Fixture contract for the PageIndex (VectifyAI) demo. Not an offer to contract.

${toMarkdown(tree)}
`;

writeFileSync(join(outDir, "lumin-acme-msa.md"), md);
console.log(`Wrote fixtures to ${outDir}`);
