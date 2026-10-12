import type { AccuracyCheck, EvidenceIndex, Verdict } from "./types";

function hasLiteral(index: EvidenceIndex, value: string): boolean {
  return index.semantic.literals.some((literal) => literal.value === value);
}

function hasExport(index: EvidenceIndex, name: string): boolean {
  return index.graph.exports.some((entry) => entry.key.includes(`"${name}"`));
}

function hasFunction(index: EvidenceIndex, name: string): boolean {
  return index.semantic.functions.some((fn) => fn.name === name);
}

function hasSlot(index: EvidenceIndex, name: string): boolean {
  return index.semantic.property_slots.includes(name);
}

function hasExpression(index: EvidenceIndex, label: string): boolean {
  return index.semantic.expression_labels.includes(label);
}

function hasKind(index: EvidenceIndex, kind: string): boolean {
  return (index.graph.kinds[kind] ?? 0) > 0;
}

function traceStatus(index: EvidenceIndex, seed: string): string | null {
  const trace = index.traces.find((item) => item.seed === seed);
  return typeof trace?.coverage_status === "string" ? trace.coverage_status : null;
}

function check(
  id: string,
  claim: string,
  matched: boolean,
  rea: string,
  source: string,
  verdict: Verdict = matched ? "match" : "miss",
): AccuracyCheck {
  return { id, claim, verdict, rea, source };
}

export function scoreAccuracy(index: EvidenceIndex): AccuracyCheck[] {
  return [
    check(
      "literal-field-kind",
      "Field kind literal lumin-sign-field:signature is in the semantic graph",
      hasLiteral(index, "lumin-sign-field:signature"),
      "semantic literal value",
      "constants.ts SIGN_FIELD_KIND / fields.ts kind",
    ),
    check(
      "export-place",
      "Export placeSignatureField survived minify and was recovered",
      hasExport(index, "placeSignatureField"),
      "application graph module-export key",
      "fields.ts placeSignatureField + index.ts re-export",
    ),
    check(
      "export-capture",
      "Export SignatureCapture survived minify and was recovered",
      hasExport(index, "SignatureCapture"),
      "application graph module-export key",
      "capture.ts class SignatureCapture",
    ),
    check(
      "export-write",
      "Export writeSignatureOntoPdf survived minify and was recovered",
      hasExport(index, "writeSignatureOntoPdf"),
      "application graph module-export key",
      "pdf-write.ts writeSignatureOntoPdf",
    ),
    check(
      "import-pdf-lib",
      "Static import of pdf-lib was recorded (unresolved, external)",
      index.graph.exports.some((entry) => String(entry.key).includes("pdf-lib")),
      "static-import:pdf-lib + external:pdf-lib",
      "pdf-write.ts import { PDFDocument } from \"pdf-lib\"",
    ),
    check(
      "slot-embed",
      "embedPng and drawImage appear as property slots / expression reads",
      hasSlot(index, "embedPng") && hasSlot(index, "drawImage"),
      "semantic property-slot embedPng, drawImage",
      "pdf-write.ts document.embedPng + page.drawImage",
    ),
    check(
      "todataurl",
      "Canvas export path toDataURL was observed",
      hasExpression(index, "read:/canvas/toDataURL"),
      "semantic expression read:/canvas/toDataURL",
      "capture.ts exportPng → canvas.toDataURL(SIGN_CAPTURE_MIME)",
    ),
    check(
      "pointer-literals",
      "pointerdown / pointermove / pointerup literals were observed",
      hasLiteral(index, "pointerdown") &&
        hasLiteral(index, "pointermove") &&
        hasLiteral(index, "pointerup"),
      "semantic literals",
      "capture.ts SIGN_POINTER_* addEventListener names",
    ),
    check(
      "method-exportPng",
      "Class method names attach / exportPng / isEmpty survived as identifiers",
      hasFunction(index, "attach") && hasFunction(index, "exportPng") && hasFunction(index, "isEmpty"),
      "semantic function names",
      "capture.ts public methods (not minified away)",
    ),
    check(
      "trace-place",
      "Application-graph string trace for lumin-sign-flow:place-field matched",
      traceStatus(index, "lumin-sign-flow:place-field") === "complete-within-source",
      "trace_application_feature coverage complete-within-source",
      "fields.ts flow: SIGN_FLOW_PLACE on the returned field",
    ),
    check(
      "trace-capture-miss",
      "Application-graph string trace for lumin-sign-flow:capture found no seed",
      true,
      `trace coverage ${traceStatus(index, "lumin-sign-flow:capture") ?? "missing"} (literal still in semantic graph)`,
      "capture.ts dataset.luminSignFlow = SIGN_FLOW_CAPTURE — literal exists, graph-string seed did not index it",
      traceStatus(index, "lumin-sign-flow:capture") === "no-match" ? "miss" : "unknown",
    ),
    check(
      "trace-pointer-miss",
      "Application-graph string trace for pointerdown found no seed",
      true,
      `trace coverage ${traceStatus(index, "pointerdown") ?? "missing"}`,
      "capture.ts addEventListener(\"pointerdown\") — semantic hit, application-graph string seed miss",
      traceStatus(index, "pointerdown") === "no-match" ? "miss" : "unknown",
    ),
    check(
      "internal-names",
      "Internal helpers clamp and decodePngDataUrl kept their original names",
      hasFunction(index, "clamp") || hasFunction(index, "decodePngDataUrl"),
      `recovered function names include minified ${index.semantic.functions
        .map((fn) => fn.name)
        .filter((name) => typeof name === "string" && name.length <= 2)
        .join(", ")}`,
      "fields.ts clamp / pdf-write.ts decodePngDataUrl — bun --minify renamed them",
    ),
    check(
      "electron-overclaim",
      "Graph classified the fixture as Electron main + renderer",
      !hasKind(index, "electron-main") && !hasKind(index, "electron-renderer"),
      `kinds electron-main=${index.graph.kinds["electron-main"] ?? 0}, electron-renderer=${index.graph.kinds["electron-renderer"] ?? 0}`,
      "This is a browser ESM bundle + HTML script tag, not an Electron app",
    ),
    check(
      "stats-modules",
      "Summary statistic modules equals recovered javascript-module nodes",
      index.statistics.modules === index.graph.kinds["javascript-module"],
      `statistics.modules=${String(index.statistics.modules)} vs graph javascript-module=${index.graph.kinds["javascript-module"] ?? 0}`,
      "Different REA counters: summary.modules vs application-graph module nodes",
    ),
  ];
}

export function tally(checks: AccuracyCheck[]): { match: number; miss: number; unknown: number } {
  return checks.reduce(
    (acc, check) => {
      acc[check.verdict] += 1;
      return acc;
    },
    { match: 0, miss: 0, unknown: 0 },
  );
}
