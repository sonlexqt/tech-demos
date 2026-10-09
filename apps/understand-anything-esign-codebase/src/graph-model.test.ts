import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { explainNode, impactForDiff, searchNodes } from "./graph-model";
import type { KnowledgeGraph, SampleDiff } from "./ua-types";

const appRoot = join(import.meta.dir, "..");

async function loadGraph(): Promise<KnowledgeGraph> {
  return JSON.parse(await readFile(join(appRoot, "public/ua/knowledge-graph.json"), "utf8")) as KnowledgeGraph;
}

async function loadDiffs(): Promise<SampleDiff[]> {
  const file = JSON.parse(await readFile(join(appRoot, "public/ua/sample-diffs.json"), "utf8")) as {
    samples: SampleDiff[];
  };
  return file.samples;
}

describe("committed Understand-Anything graph", () => {
  test("has version, project, nodes, edges, layers, tour", async () => {
    const graph = await loadGraph();
    expect(graph.version).toBe("1.0.0");
    expect(graph.kind).toBe("codebase");
    expect(graph.project.name).toBe("lumin-sign-fixture");
    expect(graph.nodes.length).toBeGreaterThan(30);
    expect(graph.edges.length).toBeGreaterThan(40);
    expect(graph.layers.map((layer) => layer.name)).toEqual(["API", "Service", "Data", "Utility", "Test"]);
    expect(graph.tour.length).toBe(9);
  });

  test("every edge and tour/layer id resolves", async () => {
    const graph = await loadGraph();
    const ids = new Set(graph.nodes.map((node) => node.id));
    for (const edge of graph.edges) {
      expect(ids.has(edge.source)).toBe(true);
      expect(ids.has(edge.target)).toBe(true);
    }
    for (const layer of graph.layers) {
      for (const id of layer.nodeIds) expect(ids.has(id)).toBe(true);
    }
    for (const step of graph.tour) {
      for (const id of step.nodeIds) expect(ids.has(id)).toBe(true);
    }
  });
});

describe("search + explain + diff-impact", () => {
  test("reminder search hits the scheduler", async () => {
    const graph = await loadGraph();
    const hits = searchNodes(graph, "which parts handle reminders");
    expect(hits.some((node) => node.filePath === "src/reminders/scheduler.ts")).toBe(true);
  });

  test("explain createSignatureRequest lists orchestrator calls", async () => {
    const graph = await loadGraph();
    const report = explainNode(graph, "function:src/requests/create-request.ts:createSignatureRequest", {});
    expect(report?.node.complexity).toBe("complex");
    const outgoing = report?.outgoing.map((row) => row.edge.type) ?? [];
    expect(outgoing).toContain("calls");
    expect(report?.outgoing.some((row) => row.node.name === "resolveSigningOrder")).toBe(true);
  });

  test("reminder cadence diff walks 1-hop and tested_by", async () => {
    const graph = await loadGraph();
    const diffs = await loadDiffs();
    const sample = diffs.find((item) => item.id === "reminder-cadence");
    expect(sample).toBeTruthy();
    const impact = impactForDiff(graph, sample!);
    expect(impact.changed.some((node) => node.filePath === "src/reminders/scheduler.ts")).toBe(true);
    expect(impact.tests.some((node) => node.filePath === "tests/reminders.test.ts")).toBe(true);
    expect(impact.layers.map((layer) => layer.name)).toContain("Service");
    expect(impact.overlay.affectedNodeIds.length).toBeGreaterThan(3);
  });
});
