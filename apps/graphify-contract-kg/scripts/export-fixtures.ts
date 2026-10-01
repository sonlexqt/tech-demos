import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { documents } from "../src/data/documents";
import { edges } from "../src/data/edges";
import { nodes } from "../src/data/nodes";
import { cannedQueries } from "../src/data/queries";
import { validatePackage } from "../src/graph";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "fixtures");

const graph = {
  directed: true,
  corpus: "lumin-acme-msa-nda",
  generator: "apps/graphify-contract-kg fixtures — Graphify-shaped node-link JSON",
  nodes,
  edges,
};

const errors = validatePackage(graph, cannedQueries);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "graph.json"), `${JSON.stringify(graph, null, 2)}\n`);
writeFileSync(join(outDir, "canned-queries.json"), `${JSON.stringify(cannedQueries, null, 2)}\n`);
writeFileSync(
  join(outDir, "package.json"),
  `${JSON.stringify(
    {
      title: "Lumin Sign, Inc. × Acme Holdings LLC — pre-signature package",
      documents: documents.map((d) => ({
        id: d.id,
        title: d.title,
        filename: d.filename,
        pages: d.pages,
      })),
    },
    null,
    2,
  )}\n`,
);

for (const doc of documents) {
  writeFileSync(join(outDir, doc.filename), doc.body.endsWith("\n") ? doc.body : `${doc.body}\n`);
}

console.log(`Wrote ${nodes.length} nodes, ${edges.length} edges, ${cannedQueries.length} queries → ${outDir}`);
