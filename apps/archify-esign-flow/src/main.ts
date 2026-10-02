import { findMessage, sequenceRelations, workflowRelations } from "./ir";
import { neighbors, probePath } from "./path-probe";
import { layoutSequence, renderSequence } from "./render-sequence";
import { layoutWorkflow, renderWorkflow } from "./render-workflow";
import { PROBE_PRESETS, SCENARIOS, type Scenario } from "./scenarios";
import { TYPE_COLOR } from "./theme";
import type { DiagramKind, Relation, SequenceIR, WorkflowIR } from "./types";
import { validateSequence, validateWorkflow, type IrReport } from "./validate";
import "./style.css";

const canvas = document.querySelector<HTMLElement>("#canvas")!;
const story = document.querySelector<HTMLElement>("#story")!;
const nodeCard = document.querySelector<HTMLElement>("#node-card")!;
const probeResult = document.querySelector<HTMLElement>("#probe-result")!;
const probeFrom = document.querySelector<HTMLSelectElement>("#probe-from")!;
const probeTo = document.querySelector<HTMLSelectElement>("#probe-to")!;
const probePresets = document.querySelector<HTMLElement>("#probe-presets")!;
const irCards = document.querySelector<HTMLElement>("#ir-cards")!;
const canvasTitle = document.querySelector<HTMLElement>("#canvas-title")!;
const canvasMeta = document.querySelector<HTMLElement>("#canvas-meta")!;
const validateBadge = document.querySelector<HTMLElement>("[data-testid='validate-badge']")!;

let workflow: WorkflowIR;
let sequence: SequenceIR;
let kind: DiagramKind = "workflow";
let scenarioId: Scenario["id"] = "complete";
let playGen = 0;
let focusId: string | null = null;
let pathNodes = new Set<string>();
let pathRels = new Set<string>();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

async function boot() {
  const [wfRaw, sqRaw] = await Promise.all([
    fetch("/ir/msa-countersign.workflow.json").then((r) => r.json()),
    fetch("/ir/msa-countersign.sequence.json").then((r) => r.json()),
  ]);
  const wf = validateWorkflow(wfRaw);
  const sq = validateSequence(sqRaw);
  if (!wf.ir || !sq.ir) throw new Error("Fixture IR failed to load");
  workflow = wf.ir;
  sequence = sq.ir;
  paintBadge(wf.report, sq.report);
  document.querySelector("#ir-workflow")!.textContent = JSON.stringify(workflow, null, 2);
  document.querySelector("#ir-sequence")!.textContent = JSON.stringify(sequence, null, 2);
  bindChrome();
  render();
  applyScenarioPreview(currentScenario());
}

function paintBadge(wf: IrReport, sq: IrReport) {
  const ok = wf.ok && sq.ok;
  validateBadge.textContent = ok
    ? `IR valid · wf v${wf.schemaVersion} · seq v${sq.schemaVersion}`
    : `IR errors · ${[...wf.errors, ...sq.errors].length}`;
  validateBadge.classList.toggle("pill-ok", ok);
  validateBadge.classList.toggle("pill-bad", !ok);
  validateBadge.title = [...wf.errors, ...sq.errors].join("\n") || `${wf.counts}\n${sq.counts}`;
}

function bindChrome() {
  document.querySelectorAll<HTMLButtonElement>("[data-diagram]").forEach((btn) => {
    btn.addEventListener("click", () => {
      kind = btn.dataset.diagram as DiagramKind;
      document.querySelectorAll("[data-diagram]").forEach((b) => b.classList.toggle("is-on", b === btn));
      stopPlay();
      render();
      applyScenarioPreview(currentScenario());
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-scenario]").forEach((btn) => {
    btn.addEventListener("click", () => {
      scenarioId = btn.dataset.scenario as Scenario["id"];
      document.querySelectorAll("[data-scenario]").forEach((b) => b.classList.toggle("is-on", b === btn));
      stopPlay();
      applyScenarioPreview(currentScenario());
    });
  });

  document.querySelector("#play-scenario")!.addEventListener("click", () => {
    void playScenario(currentScenario());
  });
  document.querySelector("#clear-btn")!.addEventListener("click", () => {
    stopPlay();
    clearHighlight();
    story.textContent = "Cleared. Highlights follow authored edges only.";
    nodeCard.innerHTML = `<p class="muted">Click a node (or a sequence message) to inspect typed IR facts.</p>`;
    probeResult.textContent = "No probe yet.";
    probeResult.classList.remove("is-ok", "is-miss");
  });

  document.querySelector("#probe-run")!.addEventListener("click", () => runProbe());
}

function currentScenario(): Scenario {
  return SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
}

function relations(): Relation[] {
  return kind === "workflow" ? workflowRelations(workflow) : sequenceRelations(sequence);
}

function endpoints(): { id: string; label: string }[] {
  if (kind === "workflow") {
    return workflow.nodes.map((n) => ({ id: n.id, label: `${n.label} (${n.id})` }));
  }
  return sequence.participants.map((p) => ({ id: p.id, label: `${p.label} (${p.id})` }));
}

function render() {
  if (kind === "workflow") {
    canvasTitle.textContent = workflow.meta.title;
    canvasMeta.textContent = `${workflow.lanes.length} lanes · ${workflow.nodes.length} nodes · mainPath ${workflow.mainPath?.length ?? 0}`;
    const layout = layoutWorkflow(workflow);
    canvas.innerHTML = renderWorkflow(layout);
  } else {
    canvasTitle.textContent = sequence.meta.title;
    canvasMeta.textContent = `${sequence.participants.length} participants · ${sequence.messages.length} messages`;
    const layout = layoutSequence(sequence);
    canvas.innerHTML = renderSequence(layout);
  }

  fillSelects();
  paintCards();
  bindDiagram();
  applyHighlight();
}

function fillSelects() {
  const opts = endpoints();
  const fromVal = probeFrom.value;
  const toVal = probeTo.value;
  probeFrom.innerHTML = opts.map((o) => `<option value="${o.id}">${o.label}</option>`).join("");
  probeTo.innerHTML = opts.map((o) => `<option value="${o.id}">${o.label}</option>`).join("");
  if (opts.some((o) => o.id === fromVal)) probeFrom.value = fromVal;
  else probeFrom.value = opts[0]?.id ?? "";
  if (opts.some((o) => o.id === toVal)) probeTo.value = toVal;
  else probeTo.value = opts[Math.min(1, opts.length - 1)]?.id ?? "";

  const presets = PROBE_PRESETS[kind];
  probePresets.innerHTML = presets
    .map((p) => `<button type="button" class="chip slim" data-preset="${p.id}">${p.label}</button>`)
    .join("");
  probePresets.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = presets.find((p) => p.id === btn.dataset.preset);
      if (!preset) return;
      probeFrom.value = preset.from;
      probeTo.value = preset.to;
      runProbe();
    });
  });
}

function paintCards() {
  const cards = (kind === "workflow" ? workflow.cards : sequence.cards) ?? [];
  irCards.innerHTML = cards
    .map(
      (c) => `<article class="ir-card">
        <h3><span class="dot dot-${c.dot}"></span>${c.title}</h3>
        <ul>${c.items.map((item) => `<li>${item}</li>`).join("")}</ul>
      </article>`,
    )
    .join("");
}

function bindDiagram() {
  canvas.querySelectorAll<SVGGElement>("[data-node-id]").forEach((el) => {
    const id = el.dataset.nodeId!;
    el.addEventListener("click", () => selectNode(id));
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        selectNode(id);
      }
    });
  });
  canvas.querySelectorAll<SVGGElement>("[data-message-id]").forEach((el) => {
    const id = el.dataset.messageId!;
    el.addEventListener("click", () => selectMessage(id));
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        selectMessage(id);
      }
    });
  });
}

function selectNode(id: string) {
  focusId = id;
  const rels = relations();
  const nb = neighbors(rels, id);
  pathNodes = new Set([id, ...nb.upstream.map((r) => r.from), ...nb.downstream.map((r) => r.to)]);
  pathRels = new Set([...nb.upstream, ...nb.downstream].map((r) => r.id));
  applyHighlight();
  if (kind === "workflow") {
    const node = workflow.nodes.find((n) => n.id === id);
    if (!node) return;
    nodeCard.innerHTML = cardHtml({
      kicker: `${node.type} · ${node.lane} · col ${node.col}`,
      title: node.label,
      id: node.id,
      color: TYPE_COLOR[node.type],
      lines: [node.sublabel, node.tag ? `tag: ${node.tag}` : null],
      upstream: nb.upstream,
      downstream: nb.downstream,
    });
    story.textContent = `Focused ${node.label}. Incident edges are authored neighbors — not a blast radius.`;
  } else {
    const p = sequence.participants.find((n) => n.id === id);
    if (!p) return;
    nodeCard.innerHTML = cardHtml({
      kicker: `${p.type} · participant`,
      title: p.label,
      id: p.id,
      color: TYPE_COLOR[p.type],
      lines: [p.sublabel],
      upstream: nb.upstream,
      downstream: nb.downstream,
    });
    story.textContent = `Focused participant ${p.label}. Messages in/out are authored only.`;
  }
}

function selectMessage(id: string) {
  const msg = findMessage(sequence, id);
  if (!msg) return;
  focusId = msg.from;
  pathNodes = new Set([msg.from, msg.to]);
  pathRels = new Set([id]);
  applyHighlight();
  nodeCard.innerHTML = cardHtml({
    kicker: `${msg.variant ?? "default"} · message`,
    title: msg.label,
    id: id,
    color: "#5ce1e6",
    lines: [`${msg.from} → ${msg.to}`, `y=${msg.y}`, msg.note ?? null],
    upstream: [],
    downstream: [],
  });
  story.textContent = `Message ${id} is an authored relationship in the sequence IR.`;
}

function cardHtml(input: {
  kicker: string;
  title: string;
  id: string;
  color: string;
  lines: (string | null | undefined)[];
  upstream: Relation[];
  downstream: Relation[];
}): string {
  const line = (rels: Relation[], empty: string) =>
    rels.length
      ? `<ul class="hops">${rels.map((r) => `<li><code>${r.from}</code> → <code>${r.to}</code> ${r.label ? `· ${r.label}` : ""}</li>`).join("")}</ul>`
      : `<p class="muted">${empty}</p>`;
  return `
    <p class="kicker" style="color:${input.color}">${input.kicker}</p>
    <h3>${input.title}</h3>
    <p class="id-line"><code>#${input.id}</code></p>
    ${input.lines.filter(Boolean).map((t) => `<p>${t}</p>`).join("")}
    <h4>Upstream</h4>
    ${line(input.upstream, "No authored inbound edge.")}
    <h4>Downstream</h4>
    ${line(input.downstream, "No authored outbound edge.")}
  `;
}

function runProbe() {
  stopPlay();
  const result = probePath(relations(), probeFrom.value, probeTo.value);
  if (!result.ok) {
    pathNodes = new Set([probeFrom.value, probeTo.value]);
    pathRels = new Set();
    applyHighlight();
    probeResult.classList.remove("is-ok");
    probeResult.classList.add("is-miss");
    probeResult.innerHTML = `<strong>No authored route.</strong><p>${result.reason}</p>`;
    story.textContent = result.reason;
    return;
  }
  pathNodes = new Set(result.nodes);
  pathRels = new Set(result.hops.map((h) => h.id));
  applyHighlight();
  probeResult.classList.remove("is-miss");
  probeResult.classList.add("is-ok");
  probeResult.innerHTML = `<strong>${result.hops.length} hop${result.hops.length === 1 ? "" : "s"}</strong>
    <ol class="hops">${result.hops
      .map((h) => `<li><code>${h.from}</code> → <code>${h.to}</code>${h.label ? ` · ${h.label}` : ""}</li>`)
      .join("")}</ol>`;
  story.textContent = `Path-probe ${probeFrom.value} → ${probeTo.value} used ${result.hops.length} authored hop(s).`;
}

function applyStepHighlight(step: Scenario["steps"][number]) {
  if (kind === "workflow") {
    pathNodes = new Set(step.pathNodes);
    pathRels = new Set(step.pathRelations);
    focusId = step.node ?? null;
  } else {
    pathNodes = new Set(step.pathParticipants);
    pathRels = new Set(step.pathMessages);
    focusId = step.message ?? null;
  }
  applyHighlight();
}

function applyScenarioPreview(scenario: Scenario) {
  if (kind === "workflow") {
    const last = scenario.steps[scenario.steps.length - 1];
    applyStepHighlight(last);
  } else {
    pathNodes = new Set(scenario.steps.flatMap((step) => step.pathParticipants));
    pathRels = new Set(scenario.steps.flatMap((step) => step.pathMessages));
    focusId = null;
    applyHighlight();
  }
  story.textContent = `${scenario.title}. ${scenario.blurb} Press Play to walk it.`;
}

async function playScenario(scenario: Scenario) {
  stopPlay();
  const gen = ++playGen;
  const wait = reduceMotion ? 80 : 900;
  for (const step of scenario.steps) {
    applyStepHighlight(step);
    story.textContent = step.caption;
    if (kind === "workflow" && step.node) selectNodeKeepPath(step.node, step.pathNodes, step.pathRelations);
    if (kind === "sequence" && step.message) {
      const msg = findMessage(sequence, step.message);
      if (msg) {
        nodeCard.innerHTML = cardHtml({
          kicker: `scenario · ${msg.variant ?? "default"}`,
          title: msg.label,
          id: msg.id ?? step.message,
          color: "#5ce1e6",
          lines: [step.caption, `${msg.from} → ${msg.to}`],
          upstream: [],
          downstream: [],
        });
      }
    }
    await sleep(wait);
    if (gen !== playGen) return;
  }
}

function selectNodeKeepPath(id: string, nodes: string[], rels: string[]) {
  const node = workflow.nodes.find((n) => n.id === id);
  if (!node) return;
  const nb = neighbors(workflowRelations(workflow), id);
  focusId = id;
  pathNodes = new Set(nodes);
  pathRels = new Set(rels);
  applyHighlight();
  nodeCard.innerHTML = cardHtml({
    kicker: `${node.type} · ${node.lane}`,
    title: node.label,
    id: node.id,
    color: TYPE_COLOR[node.type],
    lines: [node.sublabel, node.tag ? `tag: ${node.tag}` : null],
    upstream: nb.upstream,
    downstream: nb.downstream,
  });
}

function applyHighlight() {
  canvas.querySelectorAll<SVGGElement>("[data-node-id]").forEach((el) => {
    const id = el.dataset.nodeId!;
    el.classList.toggle("is-on-path", pathNodes.has(id));
    el.classList.toggle("is-focus", focusId === id);
    el.classList.toggle("is-dim", pathNodes.size > 0 && !pathNodes.has(id));
  });
  canvas.querySelectorAll<SVGGElement>("[data-edge-id]").forEach((el) => {
    const id = el.dataset.edgeId!;
    const on = pathRels.has(id);
    el.classList.toggle("is-on-path", on);
    el.classList.toggle("is-dim", pathRels.size > 0 && !on);
  });
  canvas.querySelectorAll<SVGGElement>("[data-message-id]").forEach((el) => {
    const id = el.dataset.messageId!;
    el.classList.toggle("is-on-path", pathRels.has(id));
    el.classList.toggle("is-dim", pathRels.size > 0 && !pathRels.has(id));
    el.classList.toggle("is-focus", focusId === id);
  });
}

function clearHighlight() {
  focusId = null;
  pathNodes = new Set();
  pathRels = new Set();
  applyHighlight();
}

function stopPlay() {
  playGen += 1;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

void boot();
