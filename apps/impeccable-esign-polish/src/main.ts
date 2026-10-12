import { runDetector } from "./detector";
import { applyFixtureFixes, renderFixture } from "./fixture";
import { renderCommands, renderFindingList, sourceLabel } from "./panel";
import type { DemoFinding, DetectSource } from "./types";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

const state = {
  findings: [] as DemoFinding[],
  fixed: new Set<string>(),
  selected: null as string | null,
  source: null as DetectSource | null,
  note: undefined as string | undefined,
  rawCount: 0,
  scanning: false,
};

app.innerHTML = `
  <header class="chrome-top">
    <div class="chrome-brand">
      <p class="kicker">Detector-first demo</p>
      <h1>Impeccable on a Lumin Sign countersign</h1>
      <p class="lede">
        Deterministic anti-slop detectors — no LLM — against a fixture MSA review-and-sign page.
        Findings are real <code>npx impeccable detect</code> rule ids.
      </p>
    </div>
    <div class="chrome-actions">
      <p id="source-line" class="source-line">Detector idle</p>
      <div class="count-block">
        <strong id="open-count">—</strong>
        <span>open rules</span>
      </div>
      <button type="button" id="run-detect">Run detector</button>
      <button type="button" id="reset" class="ghost">Reset fixture</button>
    </div>
  </header>

  <main class="chrome-main">
    <section class="viewport" aria-label="Lumin Sign fixture">
      <div class="viewport-bar">
        <span>Fixture · signer review-and-sign</span>
        <span id="highlight-name">No finding selected</span>
      </div>
      <div id="fixture-host" class="fixture-host">${renderFixture()}</div>
    </section>

    <aside class="side" aria-label="Impeccable findings">
      <div class="side-head">
        <h2>Findings</h2>
        <p>Click a finding to highlight it. Apply the fix — or the /impeccable command that would address it — and the count drops.</p>
      </div>
      <div id="finding-host"></div>
      <details class="vocab" open>
        <summary>24-command vocabulary</summary>
        <p class="vocab-note">Highlighted commands map to open findings. Dimmed commands are unused on this fixture.</p>
        <div id="cmd-host"></div>
      </details>
    </aside>
  </main>
`;

const fixtureHost = must("#fixture-host");
const findingHost = must("#finding-host");
const cmdHost = must("#cmd-host");
const sourceLine = must("#source-line");
const openCount = must("#open-count");
const highlightName = must("#highlight-name");
const runBtn = must<HTMLButtonElement>("#run-detect");
const resetBtn = must<HTMLButtonElement>("#reset");

findingHost.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const applyId = target.closest<HTMLElement>("[data-apply]")?.dataset.apply;
  if (applyId) {
    state.fixed.add(applyId);
    state.selected = applyId;
    render();
    return;
  }
  const findId = target.closest<HTMLElement>("[data-finding]")?.dataset.finding;
  if (findId) {
    state.selected = findId;
    render();
    document.querySelector(".is-highlighted")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

runBtn.addEventListener("click", () => {
  void detect();
});

resetBtn.addEventListener("click", () => {
  state.fixed.clear();
  state.selected = null;
  render();
});

void detect();

async function detect(): Promise<void> {
  state.scanning = true;
  runBtn.disabled = true;
  runBtn.textContent = "Scanning…";
  sourceLine.textContent = "Running npx impeccable detect —json…";
  try {
    const result = await runDetector();
    state.findings = result.findings;
    state.source = result.source;
    state.note = result.note;
    state.rawCount = result.rawCount;
    state.fixed.clear();
    state.selected = result.findings[0]?.id ?? null;
  } finally {
    state.scanning = false;
    runBtn.disabled = false;
    runBtn.textContent = "Run detector";
    render();
  }
}

function render(): void {
  const signer = fixtureHost.querySelector<HTMLElement>("#signer");
  if (signer) applyFixtureFixes(signer, state.fixed, state.selected);

  findingHost.innerHTML = renderFindingList(state.findings, state.fixed, state.selected);

  const open = state.findings.filter((f) => !state.fixed.has(f.id));
  const active = new Set(open.map((f) => f.command));
  const satisfied = new Set(
    state.findings.filter((f) => state.fixed.has(f.id)).map((f) => f.command),
  );
  for (const id of active) satisfied.delete(id);
  cmdHost.innerHTML = renderCommands(active, satisfied);

  const openN = open.length;
  const total = state.findings.length;
  openCount.textContent = state.findings.length ? String(openN) : "—";
  sourceLine.textContent = state.scanning
    ? "Scanning…"
    : `${sourceLabel(state.source, state.note, state.rawCount)} · ${openN}/${total} rules open`;

  const selected = state.findings.find((f) => f.id === state.selected);
  highlightName.textContent = selected
    ? `${selected.id} · ${selected.element}`
    : "No finding selected";

  document.documentElement.dataset.clean = openN === 0 && total > 0 ? "true" : "false";
}

function must<T extends HTMLElement = HTMLElement>(sel: string): T {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`missing ${sel}`);
  return el;
}
