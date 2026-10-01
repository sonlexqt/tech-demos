import { cannedQueries } from "./data/queries";
import { documents } from "./data/documents";
import { edges } from "./data/edges";
import { nodes } from "./data/nodes";
import {
  KIND_ORDER,
  edgesForNode,
  indexGraph,
  layoutNodes,
  matchQuery,
  pathSets,
} from "./graph";
import { GraphView } from "./render";
import type {
  CannedQuery,
  GraphEdge,
  GraphNode,
  GraphPackage,
  LiveStatus,
  NodeKind,
  PathHit,
} from "./types";
import "./style.css";

const pkg: GraphPackage = {
  directed: true,
  corpus: "lumin-acme-msa-nda",
  nodes,
  edges,
};

const { nodeById, edgeById, degree, godNodes } = indexGraph(pkg);
const laidOut = layoutNodes(pkg.nodes);

const $ = <T extends Element>(sel: string) => {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Missing ${sel}`);
  return el;
};

const chipsEl = $("#chips");
const walkEl = $("#walk-log");
const inspectorEl = $("#inspector");
const answerEl = $("#answer");
const askInput = $<HTMLTextAreaElement>("#ask");
const godEl = $("#god-nodes");
const legendEl = $("#legend");
const liveBtn = $<HTMLButtonElement>("#mode-live");
const fixtureBtn = $<HTMLButtonElement>("#mode-fixture");
const liveNote = $<HTMLElement>("#live-note");
const badge = $("#mode-badge");
const statsEl = $("#graph-stats");

let selected: { type: "node" | "edge"; id: string } | null = null;
let hit: PathHit | null = null;
let walkTimer = 0;
const hiddenKinds = new Set<NodeKind>();

const view = new GraphView($<SVGSVGElement>("#graph"), {
  onNode: (id) => select({ type: "node", id }),
  onEdge: (id) => select({ type: "edge", id }),
});
view.setData(laidOut, pkg.edges);

statsEl.textContent = `${pkg.nodes.length} nodes · ${pkg.edges.length} explained edges · fixture MSA + NDA`;

for (const q of cannedQueries) {
  const btn = document.createElement("button");
  btn.className = "chip";
  btn.type = "button";
  btn.textContent = q.chip;
  btn.dataset.id = q.id;
  btn.addEventListener("click", () => playQuery(q));
  chipsEl.append(btn);
}

godEl.innerHTML = godNodes
  .map((n) => {
    const deg = degree.get(n.id) ?? 0;
    return `<button type="button" class="god" data-id="${n.id}"><span>${escapeHtml(n.label)}</span><em>${deg} edges</em></button>`;
  })
  .join("");
godEl.querySelectorAll<HTMLButtonElement>(".god").forEach((btn) => {
  btn.addEventListener("click", () => select({ type: "node", id: btn.dataset.id ?? "" }));
});

for (const kind of KIND_ORDER) {
  const label = document.createElement("label");
  label.className = `legend-item k-${kind}`;
  label.innerHTML = `<input type="checkbox" checked data-kind="${kind}" /><span class="swatch"></span>${kind}`;
  legendEl.append(label);
}
legendEl.addEventListener("change", (event) => {
  const input = event.target as HTMLInputElement;
  const kind = input.dataset.kind as NodeKind | undefined;
  if (!kind) return;
  if (input.checked) hiddenKinds.delete(kind);
  else hiddenKinds.add(kind);
  view.setHiddenKinds(hiddenKinds);
  view.highlight(hit, selected ?? undefined);
});

$("#ask-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const match = matchQuery(askInput.value, cannedQueries);
  if (!match) {
    clearWalk();
    answerEl.className = "answer-card is-empty";
    answerEl.innerHTML =
      "<h3>No confident path</h3><p>Try a canned chip, or a close paraphrase (liability cap, ninety days, confidential information).</p>";
    return;
  }
  playQuery(match);
});

$("#clear").addEventListener("click", () => {
  askInput.value = "";
  clearWalk();
  selected = null;
  renderInspector(null);
  view.highlight(null);
  syncChips(null);
});

liveBtn.addEventListener("click", () => {
  liveNote.hidden = false;
});

void probeLive();
renderInspector(null);

async function probeLive() {
  try {
    const res = await fetch("/api/graphify-status");
    if (!res.ok) throw new Error("status");
    const status = (await res.json()) as LiveStatus;
    liveBtn.disabled = !status.available;
    liveBtn.title = status.note;
    liveNote.textContent = status.note;
    if (status.available) {
      liveBtn.textContent = "Live (CLI)";
    }
  } catch {
    liveBtn.disabled = true;
    liveBtn.title = "graphify CLI not reachable from this Vite server.";
  }
  fixtureBtn.classList.add("is-on");
  badge.textContent = "Fixture mode";
  badge.className = "badge badge-fixture";
}

function playQuery(query: CannedQuery) {
  window.clearTimeout(walkTimer);
  askInput.value = query.question;
  syncChips(query.id);
  const sets = pathSets(query);
  hit = { nodeIds: sets.nodeIds, edgeIds: sets.edgeIds };
  walkEl.replaceChildren();
  answerEl.className = "answer-card is-empty";
  answerEl.innerHTML = "<h3>Walking the graph</h3><p>Stepping explained edges…</p>";
  let i = 0;
  const step = () => {
    const current = query.steps[i];
    if (!current) {
      answerEl.className = "answer-card";
      answerEl.innerHTML = `<h3>Path answer</h3><p>${escapeHtml(query.answer)}</p>`;
      hit = { ...hit!, currentNodeId: undefined, currentEdgeId: undefined };
      view.highlight(hit, selected ?? undefined);
      return;
    }
    hit = {
      nodeIds: sets.nodeIds,
      edgeIds: sets.edgeIds,
      currentNodeId: current.nodeId,
      currentEdgeId: current.edgeId,
    };
    if (current.edgeId) {
      selected = { type: "edge", id: current.edgeId };
      renderInspector(edgeById.get(current.edgeId) ?? null);
    } else if (current.nodeId) {
      selected = { type: "node", id: current.nodeId };
      renderInspector(nodeById.get(current.nodeId) ?? null);
    }
    view.highlight(hit, selected ?? undefined);
    appendWalk(current.note, current.edgeId);
    i += 1;
    walkTimer = window.setTimeout(step, 620);
  };
  step();
}

function appendWalk(note: string, edgeId?: string) {
  const li = document.createElement("li");
  li.className = "is-current";
  const edge = edgeId ? edgeById.get(edgeId) : undefined;
  if (edge) {
    li.innerHTML = `<strong>${escapeHtml(edge.relation)}</strong> · <span class="conf c-${edge.confidence.toLowerCase()}">${edge.confidence}</span><p>${escapeHtml(edge.why)}</p><em>${escapeHtml(note)}</em>`;
  } else {
    li.innerHTML = `<p>${escapeHtml(note)}</p>`;
  }
  walkEl.querySelectorAll("li").forEach((item) => item.classList.remove("is-current"));
  walkEl.append(li);
  li.scrollIntoView({ block: "nearest" });
}

function clearWalk() {
  window.clearTimeout(walkTimer);
  hit = null;
  walkEl.replaceChildren();
  answerEl.className = "answer-card is-empty";
  answerEl.innerHTML =
    "<h3>Ask the graph</h3><p>Pick a chip. The walker highlights a path and shows each edge’s plain-English why — not a vector hit list.</p>";
  syncChips(null);
}

function select(next: { type: "node" | "edge"; id: string }) {
  selected = next;
  if (next.type === "node") renderInspector(nodeById.get(next.id) ?? null);
  else renderInspector(edgeById.get(next.id) ?? null);
  view.highlight(hit, selected);
}

function renderInspector(item: GraphNode | GraphEdge | null) {
  if (!item) {
    inspectorEl.innerHTML = `
      <div class="empty">
        <h3>Inspector</h3>
        <p>Click a node or an edge. Every edge carries a confidence tag and a why — Graphify’s difference from chunked vector RAG and from a PageIndex TOC walk.</p>
      </div>`;
    return;
  }
  if ("why" in item) {
    const src = nodeById.get(item.source);
    const tgt = nodeById.get(item.target);
    inspectorEl.innerHTML = `
      <p class="kicker">Edge · ${escapeHtml(item.relation)}</p>
      <h3>${escapeHtml(src?.label ?? item.source)} → ${escapeHtml(tgt?.label ?? item.target)}</h3>
      <p class="badges">
        <span class="conf c-${item.confidence.toLowerCase()}">${item.confidence}</span>
        <span class="meta">${item.confidence_score.toFixed(2)}</span>
      </p>
      <blockquote class="why"><strong>Why</strong>${escapeHtml(item.why)}</blockquote>
      <p class="meta">${escapeHtml(item.source_file)}</p>`;
    return;
  }
  const incident = edgesForNode(pkg, item.id);
  const doc = documents.find((d) => d.filename === item.source_file);
  inspectorEl.innerHTML = `
    <p class="kicker">${item.kind} · ${escapeHtml(item.community)}</p>
    <h3>${escapeHtml(item.label)}</h3>
    <p>${escapeHtml(item.summary)}</p>
    <blockquote>${escapeHtml(item.excerpt)}</blockquote>
    <p class="meta">${escapeHtml(item.source_file)}${item.source_location ? ` · ${escapeHtml(item.source_location)}` : ""} · ${degree.get(item.id) ?? 0} edges</p>
    <h4>Incident edges</h4>
    <ul class="incident">${incident
      .map((e) => {
        const otherId = e.source === item.id ? e.target : e.source;
        const other = nodeById.get(otherId);
        return `<li><button type="button" data-edge="${e.id}"><span>${escapeHtml(e.relation)}</span> ${escapeHtml(other?.label ?? otherId)} <em class="conf c-${e.confidence.toLowerCase()}">${e.confidence}</em></button></li>`;
      })
      .join("")}</ul>
    ${doc ? `<details class="src"><summary>Source: ${escapeHtml(doc.title)}</summary><pre>${escapeHtml(doc.body)}</pre></details>` : ""}`;
  inspectorEl.querySelectorAll<HTMLButtonElement>("[data-edge]").forEach((btn) => {
    btn.addEventListener("click", () => select({ type: "edge", id: btn.dataset.edge ?? "" }));
  });
}

function syncChips(id: string | null) {
  chipsEl.querySelectorAll<HTMLButtonElement>(".chip").forEach((btn) => {
    btn.classList.toggle("is-on", btn.dataset.id === id);
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
