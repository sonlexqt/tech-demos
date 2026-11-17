import type { BaseEvent, Interrupt } from "@ag-ui/core";
import type { EnvelopeState, GroundTruth, HumanCorrection } from "../shared/types";
import { cloneEnvelope, describeCorrections, initialEnvelope } from "../shared/envelope";
import { defaultApprovalPayload, type ApprovalPayload } from "../shared/interrupt-schema";
import { EnvelopeSession } from "./agent-session";
import { renderSchemaForm } from "./interrupt-form";
import { PdfBoard } from "./pdf-board";
import { appendEvent, renderScorePanel } from "./run-log";

const pagesEl = document.getElementById("pages") as HTMLElement;
const prepareBtn = document.getElementById("prepare-btn") as HTMLButtonElement;
const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
const modeSelect = document.getElementById("mode-select") as HTMLSelectElement;
const modeHint = document.getElementById("mode-hint") as HTMLElement;
const narrationEl = document.getElementById("narration") as HTMLElement;
const interruptCard = document.getElementById("interrupt-card") as HTMLElement;
const interruptMessage = document.getElementById("interrupt-message") as HTMLElement;
const interruptForm = document.getElementById("interrupt-form") as HTMLFormElement;
const cancelBtn = document.getElementById("cancel-btn") as HTMLButtonElement;
const fieldCountEl = document.getElementById("field-count") as HTMLElement;
const timeline = document.getElementById("event-timeline") as HTMLOListElement;
const runMeta = document.getElementById("run-meta") as HTMLElement;
const scorePanel = document.getElementById("score-panel") as HTMLElement;

const board = new PdfBoard(pagesEl);
let truth: GroundTruth | null = null;
let liveAvailable = false;
let startedAt = 0;
let agentSnapshot: EnvelopeState | null = null;
let formValue: ApprovalPayload | null = null;
let lastFieldCount = 0;

const session = new EnvelopeSession({
  onEvent: (event: BaseEvent) => {
    if (!startedAt) startedAt = performance.now();
    appendEvent(timeline, event, startedAt);
  },
  onState: (state) => {
    board.setState(state);
    fieldCountEl.textContent = `${state.fields.length} field${state.fields.length === 1 ? "" : "s"}`;
    if (state.fields.length > lastFieldCount) {
      const newest = state.fields[state.fields.length - 1];
      board.scrollToPage(newest.page);
    }
    lastFieldCount = state.fields.length;
  },
  onNarration: (text) => {
    narrationEl.textContent = text;
  },
  onInterrupt: (interrupt, state) => {
    agentSnapshot = cloneEnvelope(state);
    board.setEditable(true);
    showInterrupt(interrupt, state);
    runMeta.textContent = "Interrupted — confirm the envelope. You can drag, resize, or delete boxes.";
  },
  onFinished: (state, result) => {
    board.setEditable(false);
    interruptCard.classList.add("hidden");
    const rec = (result ?? {}) as {
      summary?: string;
      scoring?: unknown;
      humanCorrections?: HumanCorrection[];
    };
    const corrections =
      rec.humanCorrections ??
      (agentSnapshot ? describeCorrections(agentSnapshot, state) : []);
    if (truth) {
      renderScorePanel(
        scorePanel,
        state,
        truth,
        corrections,
        performance.now() - startedAt,
        rec.summary ?? state.summary,
      );
    }
    runMeta.textContent = state.summary ?? "Run finished.";
    narrationEl.textContent = state.summary ?? narrationEl.textContent;
    prepareBtn.disabled = false;
  },
  onError: (message) => {
    narrationEl.textContent = message;
    prepareBtn.disabled = false;
    runMeta.textContent = `Error: ${message}`;
  },
});

board.setEditHandler((state) => {
  session.pushState(state);
  if (formValue) {
    formValue = { ...formValue };
  }
});

function showInterrupt(interrupt: Interrupt, state: EnvelopeState): void {
  interruptCard.classList.remove("hidden");
  interruptMessage.textContent = interrupt.message ?? "Confirm this envelope.";
  formValue = defaultApprovalPayload(state);
  const schema = (interrupt.responseSchema ?? {}) as Parameters<typeof renderSchemaForm>[1];
  renderSchemaForm(interruptForm, schema, formValue, (next) => {
    formValue = next as ApprovalPayload;
  });
}

interruptForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!formValue) return;
  prepareBtn.disabled = true;
  try {
    await session.resume(
      formValue,
      formValue.approved === false ? "cancelled" : "resolved",
      modeSelect.value === "live" ? "live" : "mock",
    );
  } catch (error) {
    narrationEl.textContent = error instanceof Error ? error.message : String(error);
    prepareBtn.disabled = false;
  }
});

cancelBtn.addEventListener("click", async () => {
  try {
    await session.resume(
      formValue ?? {},
      "cancelled",
      modeSelect.value === "live" ? "live" : "mock",
    );
  } catch (error) {
    narrationEl.textContent = error instanceof Error ? error.message : String(error);
  }
});

prepareBtn.addEventListener("click", async () => {
  prepareBtn.disabled = true;
  interruptCard.classList.add("hidden");
  timeline.innerHTML = "";
  scorePanel.innerHTML = "";
  lastFieldCount = 0;
  startedAt = performance.now();
  runMeta.textContent = "Run started…";
  board.setEditable(false);
  session.reset();
  board.setState(initialEnvelope());
  try {
    await session.prepare(modeSelect.value === "live" ? "live" : "mock");
  } catch (error) {
    narrationEl.textContent = error instanceof Error ? error.message : String(error);
    prepareBtn.disabled = false;
  }
});

resetBtn.addEventListener("click", () => {
  window.location.reload();
});

async function boot(): Promise<void> {
  const [health, gt] = await Promise.all([
    fetch("/api/health").then((r) => r.json()) as Promise<{ liveConfigured: boolean }>,
    fetch("/api/ground-truth").then((r) => r.json()) as Promise<GroundTruth>,
  ]);
  liveAvailable = health.liveConfigured;
  truth = gt;
  if (!liveAvailable) {
    const liveOpt = modeSelect.querySelector('option[value="live"]');
    if (liveOpt) liveOpt.textContent = "LIVE (needs GEMINI_API_KEY)";
  }
  modeSelect.addEventListener("change", () => {
    const live = modeSelect.value === "live";
    modeHint.textContent = live
      ? liveAvailable
        ? "Gemini Flash via GEMINI_API_KEY"
        : "LIVE unavailable — no key on server"
      : "No API key needed";
    modeHint.className = live && liveAvailable ? "hint-pill ok" : live ? "hint-pill warn" : "hint-pill";
  });
  await board.load("/fixture-msa.pdf");
}

void boot();
