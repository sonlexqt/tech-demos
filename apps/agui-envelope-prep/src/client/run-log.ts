import type { BaseEvent } from "@ag-ui/core";
import type { EnvelopeState, GroundTruth, HumanCorrection, ScoringReport } from "../shared/types";
import { formatPercent, scoreEnvelope } from "../shared/scoring";

export function appendEvent(list: HTMLOListElement, event: BaseEvent, startedAt: number): void {
  const li = document.createElement("li");
  const t = document.createElement("span");
  t.className = "t";
  t.textContent = event.type;
  const extra = document.createElement("span");
  extra.textContent = eventHint(event, startedAt);
  li.append(t, extra);
  list.prepend(li);
}

function eventHint(event: BaseEvent, startedAt: number): string {
  const dt = `${Math.round(performance.now() - startedAt)}ms`;
  const rec = event as Record<string, unknown>;
  if (event.type === "TOOL_CALL_START") return `${dt} · ${rec.toolCallName}`;
  if (event.type === "TEXT_MESSAGE_CONTENT") return dt;
  if (event.type === "STATE_DELTA") return `${dt} · patch`;
  if (event.type === "STATE_SNAPSHOT") return `${dt} · snapshot`;
  if (event.type === "RUN_FINISHED") {
    const outcome = rec.outcome as { type?: string } | undefined;
    return `${dt} · ${outcome?.type ?? "success"}`;
  }
  return dt;
}

export function renderScorePanel(
  host: HTMLElement,
  predicted: EnvelopeState,
  truth: GroundTruth,
  corrections: HumanCorrection[],
  durationMs: number,
  summary?: string,
): ScoringReport {
  const scoring = scoreEnvelope(predicted, truth, { humanCorrections: corrections });
  const rows = scoring.fields
    .map((f) => {
      const status = f.correct
        ? `<span class="ok-text">match</span>`
        : `<span class="bad-text">${f.predictedId ? "mismatch" : "missing"}</span>`;
      const human = f.humanCorrected ? "yes" : "—";
      return `<tr><td>${f.type}</td><td>${f.signerId}</td><td>${f.predictedPage ?? "—"}</td><td>${f.iou.toFixed(2)}</td><td>${status}</td><td>${human}</td></tr>`;
    })
    .join("");
  const correctionList = corrections.length
    ? `<ul>${corrections.map((c) => `<li>${c.detail}</li>`).join("")}</ul>`
    : "<p class='muted'>No human box edits.</p>";
  host.innerHTML = `
    <p class="muted">Duration ${Math.round(durationMs)} ms · precision ${formatPercent(scoring.precision)} · recall ${formatPercent(scoring.recall)}</p>
    <table class="score-table">
      <thead><tr><th>Type</th><th>Signer</th><th>Page</th><th>IoU</th><th>vs GT</th><th>Human</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <h3 class="muted">Human corrections</h3>
    ${correctionList}
    ${summary ? `<div class="summary-box">${summary}</div>` : ""}
  `;
  return scoring;
}
