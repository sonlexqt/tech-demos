import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "fixtures/rea-output");

type Json = Record<string, unknown>;

async function load(name: string): Promise<Json> {
  return JSON.parse(await readFile(resolve(outDir, name), "utf8")) as Json;
}

function asRecord(value: unknown): Json {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : {};
}

function asArray(value: unknown): Json[] {
  return Array.isArray(value) ? (value as Json[]) : [];
}

const analyze = await load("analyze-javascript-application.json");
const summaryView = await load("inspect-analysis-view-summary.json");
const nr = asRecord(analyze.normalized_result);
const graph = asRecord(nr.graph);
const semantic = asRecord(nr.semantic_graph);

const literals = asArray(semantic.nodes)
  .filter((node) => node.kind === "literal")
  .map((node) => ({
    node_id: node.node_id,
    label: node.label,
    value: asRecord(node.properties).value ?? null,
  }));

const functions = asArray(semantic.nodes)
  .filter((node) => node.kind === "function")
  .map((node) => ({
    node_id: node.node_id,
    name: asRecord(node.properties).name ?? node.label ?? null,
  }));

const propertySlots = asArray(semantic.nodes)
  .filter((node) => node.kind === "property-slot")
  .map((node) => asRecord(node.properties).name ?? node.label)
  .filter((name): name is string => typeof name === "string");

const expressions = asArray(semantic.nodes)
  .filter((node) => node.kind === "expression")
  .map((node) => (typeof node.label === "string" ? node.label : ""))
  .filter(Boolean);

const exports = asArray(graph.nodes)
  .filter((node) => node.kind === "javascript-module")
  .map((node) => {
    const identity = asRecord(node.identity);
    const key = typeof identity.key === "string" ? identity.key : "";
    return { node_id: node.node_id, key, namespace: identity.namespace };
  });

const traces = [];
for (const file of [
  "trace-lumin-sign-field-signature.json",
  "trace-lumin-sign-flow-place-field.json",
  "trace-lumin-sign-flow-capture.json",
  "trace-lumin-sign-flow-pdf-write.json",
  "trace-lumin-sign-write-embedPng.json",
  "trace-pointerdown.json",
]) {
  const record = await load(file);
  const trace = asRecord(record.normalized_result);
  const coverage = asRecord(trace.coverage);
  const seed = asRecord(trace.seed);
  traces.push({
    file,
    evidence_id: record.evidence_id,
    seed: seed.value ?? null,
    coverage_status: coverage.status ?? null,
    seed_matches: coverage.total_seed_matches ?? null,
    summary: trace.summary ?? null,
  });
}

const index = {
  rea_package: "rea-agents@6.4.0",
  analyze_evidence_id: analyze.evidence_id,
  inspect_evidence_id: summaryView.evidence_id,
  operation: analyze.operation,
  provider: analyze.provider,
  subject: analyze.subject,
  confidence: analyze.confidence,
  authority: analyze.authority,
  statistics: asRecord(nr.statistics),
  limitations: nr.limitations,
  graph: {
    schema: graph.schema,
    graph_id: graph.graph_id,
    coverage: graph.coverage,
    node_count: asArray(graph.nodes).length,
    edge_count: asArray(graph.edges).length,
    kinds: Object.fromEntries(
      [...asArray(graph.nodes).reduce((map, node) => {
        const kind = String(node.kind);
        map.set(kind, (map.get(kind) ?? 0) + 1);
        return map;
      }, new Map<string, number>())].map(([kind, count]) => [kind, count]),
    ),
    exports,
    edges: asArray(graph.edges).map((edge) => ({
      kind: edge.kind,
      source_node_id: edge.source_node_id,
      target_node_id: edge.target_node_id,
    })),
  },
  semantic: {
    graph_id: semantic.graph_id,
    node_count: asArray(semantic.nodes).length,
    relation_count: asArray(semantic.relations).length,
    literals,
    functions,
    property_slots: [...new Set(propertySlots)],
    expression_labels: [...new Set(expressions)].sort(),
  },
  traces,
};

const report = {
  title: "How signing really works",
  subtitle: "Evidence-backed teardown of an owned Lumin Sign fixture (JS bundle only)",
  mode: "offline-fixture",
  disclaimer:
    "This target is a first-party demo signer we wrote. REA never inspected a third-party or competitor product. Findings are static: syntax observations and relationship inferences, not runtime proof.",
  rea: {
    package: "rea-agents@6.4.0",
    skill: "reverse-engineer-anything",
    operations: [
      "analyze_javascript_application",
      "inspect_analysis_view",
      "trace_application_feature",
    ],
    analyze_evidence_id: analyze.evidence_id,
    inspect_evidence_id: summaryView.evidence_id,
    provider: asRecord(analyze.provider).id,
    authority: analyze.authority,
    confidence: analyze.confidence,
    graph_id: graph.graph_id,
    semantic_graph_id: semantic.graph_id,
  },
  flow: [
    {
      id: "place",
      title: "1. Field placement",
      claim:
        "A click on a rendered page becomes a PDF-space rectangle tagged lumin-sign-field:signature, with page-point units and a place-field flow marker.",
      evidence: [
        "Semantic literal lumin-sign-field:signature",
        "Export placeSignatureField recovered from signer.min.js",
        "trace_application_feature seed lumin-sign-flow:place-field matched the export's static return shape",
      ],
      source_file: "fixtures/signer-src/src/fields.ts",
    },
    {
      id: "capture",
      title: "2. Signature capture",
      claim:
        "A canvas pad records polyline strokes on pointerdown/pointermove/pointerup and exports image/png via canvas.toDataURL. Empty ink throws lumin-sign-capture-empty.",
      evidence: [
        "Semantic literals pointerdown, pointermove, pointerup, image/png, lumin-sign-capture-empty",
        "Class methods attach, exportPng, clear, isEmpty survived as names",
        "Expressions read:/canvas/addEventListener and read:/canvas/toDataURL",
        "Export SignatureCapture recovered from the ESM export list",
      ],
      source_file: "fixtures/signer-src/src/capture.ts",
    },
    {
      id: "write",
      title: "3. PDF write",
      claim:
        "writeSignatureOntoPdf imports pdf-lib, loads the document, embedPngs the captured bytes, and drawImages them onto the placed field.",
      evidence: [
        "Application graph imports edge to static-import:pdf-lib and external:pdf-lib",
        "Property slots embedPng and drawImage",
        "Export writeSignatureOntoPdf recovered from signer.min.js",
        "Semantic literal lumin-sign-write:embedPng",
      ],
      source_file: "fixtures/signer-src/src/pdf-write.ts",
    },
  ],
  limitations: asArray(nr.limitations),
  notes: [
    "analyze_javascript_application parsed 1 JS file, 912 AST nodes, and built a 17-node application graph plus a 608-node semantic relation graph.",
    "inspect_analysis_view projected a summary without repeating analysis.",
    "String traces against the application graph matched some exported return-shape fields and missed other literals that the semantic graph still observed.",
    "electron-main / electron-renderer nodes come from package.json + HTML script tags. This fixture is a browser bundle, not an Electron app.",
  ],
};

await writeFile(resolve(outDir, "evidence-index.json"), `${JSON.stringify(index, null, 2)}\n`);
await writeFile(resolve(outDir, "how-signing-works.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log("wrote evidence-index.json and how-signing-works.json");
