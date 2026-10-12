import captured from "../fixtures/findings.cli.json";
import { FALLBACK_META, RULE_META } from "./commands";
import type { CliFinding, DemoFinding, DetectResponse, DetectSource } from "./types";

type BundledCapture = {
  source: string;
  findings: CliFinding[];
  exit?: number;
};

const bundled = captured as BundledCapture;

function groupFindings(raw: CliFinding[]): DemoFinding[] {
  const order: string[] = [];
  const byId = new Map<string, DemoFinding>();

  for (const item of raw) {
    const id = item.antipattern;
    const meta = RULE_META[id] ?? FALLBACK_META;
    const existing = byId.get(id);
    if (existing) {
      existing.instances.push({ snippet: item.snippet });
      if (item.severity === "warning" && existing.severity === "advisory") {
        existing.severity = "warning";
      }
      continue;
    }
    order.push(id);
    byId.set(id, {
      id,
      name: item.name,
      description: item.description,
      severity: item.advisory ? "advisory" : item.severity,
      category: item.category,
      command: meta.command,
      element: meta.element,
      whyEsign: meta.whyEsign,
      fixLabel: meta.fixLabel,
      instances: [{ snippet: item.snippet }],
    });
  }

  return order.map((id) => byId.get(id)!);
}

export function findingsFromCli(raw: CliFinding[]): DemoFinding[] {
  return groupFindings(raw);
}

export function bundledResponse(): DetectResponse {
  return {
    source: "fixture",
    exit: bundled.exit ?? 2,
    findings: bundled.findings,
    note: "Labeled fixture captured from npx impeccable detect --json. Re-run with bun run detect.",
  };
}

export async function runDetector(): Promise<{
  source: DetectSource;
  note?: string;
  findings: DemoFinding[];
  rawCount: number;
}> {
  try {
    const res = await fetch("/api/detect");
    if (!res.ok) throw new Error(`detect HTTP ${res.status}`);
    const payload = (await res.json()) as DetectResponse;
    const raw = Array.isArray(payload.findings) ? payload.findings : [];
    return {
      source: payload.source,
      note: payload.note,
      findings: findingsFromCli(raw),
      rawCount: raw.length,
    };
  } catch {
    const fallback = bundledResponse();
    return {
      source: "fixture",
      note: fallback.note,
      findings: findingsFromCli(fallback.findings),
      rawCount: fallback.findings.length,
    };
  }
}
