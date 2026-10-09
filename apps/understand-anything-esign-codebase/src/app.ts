import { explainNode, impactForDiff, searchNodes, snippet } from "./graph-model";
import { colorForLayer, layoutGraph, type LayoutNode } from "./layout";
import { fixtureSources } from "./sources";
import type { GraphNode, ImpactReport, KnowledgeGraph, SampleDiff } from "./ua-types";

const SEARCH_CHIPS = [
  { q: "reminders", label: "which parts handle reminders?" },
  { q: "signer order", label: "signer order" },
  { q: "audit", label: "audit trail" },
  { q: "webhooks", label: "webhooks" },
  { q: "createSignatureRequest", label: "create request" },
];

interface State {
  graph: KnowledgeGraph;
  diffs: SampleDiff[];
  selectedId: string | null;
  query: string;
  tourIndex: number | null;
  diffId: string | null;
  impact: ImpactReport | null;
  pan: { x: number; y: number; k: number };
}

export async function boot(root: HTMLElement) {
  const [graph, diffFile] = await Promise.all([
    fetch("/ua/knowledge-graph.json").then((res) => res.json() as Promise<KnowledgeGraph>),
    fetch("/ua/sample-diffs.json").then((res) => res.json() as Promise<{ samples: SampleDiff[] }>),
  ]);

  const state: State = {
    graph,
    diffs: diffFile.samples,
    selectedId: "function:src/requests/create-request.ts:createSignatureRequest",
    query: "",
    tourIndex: null,
    diffId: null,
    impact: null,
    pan: { x: 0, y: 0, k: 1 },
  };

  const positions = layoutGraph(graph);
  root.innerHTML = shell(graph);
  const svg = root.querySelector<SVGSVGElement>("svg.graph")!;
  bindGraph(svg, state, positions);
  bindUi(root, state, positions, svg);
  renderAll(root, state, positions);
}

function shell(graph: KnowledgeGraph): string {
  return `
    <div class="app">
      <header class="top">
        <div class="brand">
          <div class="mark" aria-hidden="true"></div>
          <div>
            <h1>Lumin Sign · Understand Anything</h1>
            <p>Code knowledge graph for the fixture e-sign core — ${graph.nodes.length} nodes, ${graph.edges.length} edges. Not the Graphify contract KG.</p>
          </div>
        </div>
        <div class="top-meta">
          <span class="badge ok">Fixture graph</span>
          <span class="cmd">/understand</span>
          <span class="cmd">/understand-explain</span>
          <span class="cmd">/understand-diff</span>
          <span class="cmd">/understand-dashboard</span>
        </div>
      </header>
      <main class="shell">
        <aside class="panel left">
          <h2>Search + tour</h2>
          <input class="search" id="search" placeholder="Search files, functions, tags…" />
          <div class="chips" id="chips">${SEARCH_CHIPS.map((chip) => `<button class="chip" data-q="${chip.q}">${chip.label}</button>`).join("")}</div>
          <div class="results" id="results"></div>
          <h2>Layers</h2>
          <div class="legend" id="legend"></div>
          <h2>Guided tour</h2>
          <div class="tour-list" id="tour"></div>
        </aside>
        <section class="panel">
          <h2>Interactive code graph</h2>
          <div class="canvas-wrap">
            <div class="tour-banner" id="tour-banner"></div>
            <svg class="graph" viewBox="0 0 1580 1080" role="img" aria-label="Lumin Sign code knowledge graph"></svg>
            <div class="hud">
              <button type="button" id="zoom-out">−</button>
              <button type="button" id="zoom-in">+</button>
              <button type="button" id="zoom-reset">Reset view</button>
              <span>Drag to pan · wheel to zoom · click a node</span>
            </div>
          </div>
        </section>
        <aside class="panel right">
          <h2>Explain · /understand-explain</h2>
          <div class="explain" id="explain"></div>
          <div class="impact" id="impact"></div>
        </aside>
      </main>
    </div>
  `;
}

function bindUi(root: HTMLElement, state: State, positions: Map<string, LayoutNode>, svg: SVGSVGElement) {
  const search = root.querySelector<HTMLInputElement>("#search")!;
  search.addEventListener("input", () => {
    state.query = search.value;
    renderLists(root, state);
  });

  root.querySelector("#chips")!.addEventListener("click", (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-q]");
    if (!btn) return;
    state.query = btn.dataset.q ?? "";
    search.value = state.query;
    const hit = searchNodes(state.graph, state.query)[0];
    if (hit) select(root, state, positions, hit.id);
    else renderLists(root, state);
  });

  root.querySelector("#results")!.addEventListener("click", (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-id]");
    if (btn?.dataset.id) select(root, state, positions, btn.dataset.id);
  });

  root.querySelector("#tour")!.addEventListener("click", (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-tour]");
    if (!btn) return;
    state.tourIndex = Number(btn.dataset.tour);
    const step = state.graph.tour[state.tourIndex];
    if (step?.nodeIds[0]) select(root, state, positions, step.nodeIds[0]);
    else renderAll(root, state, positions);
  });

  root.querySelector("#explain")!.addEventListener("click", (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-id]");
    if (btn?.dataset.id) select(root, state, positions, btn.dataset.id);
  });

  root.querySelector("#impact")!.addEventListener("change", (event) => {
    const selectEl = event.target as HTMLSelectElement;
    if (selectEl.id !== "diff-pick") return;
    state.diffId = selectEl.value || null;
    const sample = state.diffs.find((item) => item.id === state.diffId);
    state.impact = sample ? impactForDiff(state.graph, sample) : null;
    if (state.impact?.changed[0]) state.selectedId = state.impact.changed[0].id;
    renderAll(root, state, positions);
  });

  root.querySelector("#impact")!.addEventListener("click", (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-id]");
    if (btn?.dataset.id) select(root, state, positions, btn.dataset.id);
  });

  root.querySelector("#tour-banner")!.addEventListener("click", (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-tour-nav]");
    if (!btn || state.tourIndex === null) return;
    const delta = btn.dataset.tourNav === "next" ? 1 : -1;
    state.tourIndex = Math.max(0, Math.min(state.graph.tour.length - 1, state.tourIndex + delta));
    const step = state.graph.tour[state.tourIndex];
    if (step?.nodeIds[0]) select(root, state, positions, step.nodeIds[0]);
    else renderAll(root, state, positions);
  });

  root.querySelector("#zoom-in")!.addEventListener("click", () => zoom(svg, state, 1.2));
  root.querySelector("#zoom-out")!.addEventListener("click", () => zoom(svg, state, 1 / 1.2));
  root.querySelector("#zoom-reset")!.addEventListener("click", () => {
    state.pan = { x: 0, y: 0, k: 1 };
    applyPan(svg, state);
  });
}

function bindGraph(svg: SVGSVGElement, state: State, positions: Map<string, LayoutNode>) {
  let dragging = false;
  let last = { x: 0, y: 0 };

  svg.addEventListener("pointerdown", (event) => {
    if ((event.target as Element).closest(".node")) return;
    dragging = true;
    last = { x: event.clientX, y: event.clientY };
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    state.pan.x += event.clientX - last.x;
    state.pan.y += event.clientY - last.y;
    last = { x: event.clientX, y: event.clientY };
    applyPan(svg, state);
  });
  svg.addEventListener("pointerup", () => {
    dragging = false;
  });
  svg.addEventListener("wheel", (event) => {
    event.preventDefault();
    zoom(svg, state, event.deltaY < 0 ? 1.08 : 1 / 1.08);
  }, { passive: false });

  svg.addEventListener("click", (event) => {
    const node = (event.target as Element).closest<SVGGElement>("[data-node]");
    if (node?.dataset.node) {
      state.selectedId = node.dataset.node;
      const root = svg.closest(".app")!.parentElement!;
      renderAll(root, state, positions);
    }
  });
}

function zoom(svg: SVGSVGElement, state: State, factor: number) {
  state.pan.k = Math.min(2.4, Math.max(0.45, state.pan.k * factor));
  applyPan(svg, state);
}

function applyPan(svg: SVGSVGElement, state: State) {
  svg.querySelector(".viewport")?.setAttribute("transform", `translate(${state.pan.x} ${state.pan.y}) scale(${state.pan.k})`);
}

function select(root: HTMLElement, state: State, positions: Map<string, LayoutNode>, id: string) {
  state.selectedId = id;
  renderAll(root, state, positions);
}

function renderAll(root: HTMLElement, state: State, positions: Map<string, LayoutNode>) {
  renderGraph(root.querySelector("svg.graph")!, state, positions);
  renderLists(root, state);
  renderExplain(root, state);
  renderImpact(root, state);
  renderTourBanner(root, state);
}

function renderLists(root: HTMLElement, state: State) {
  const results = searchNodes(state.graph, state.query);
  root.querySelector("#results")!.innerHTML = results.length
    ? results
        .map((node) => {
          const layer = state.graph.layers.find((item) => item.nodeIds.includes(node.id));
          return `<button class="result ${node.id === state.selectedId ? "active" : ""}" data-id="${escapeAttr(node.id)}"><strong>${escapeHtml(node.name)}</strong><br><small>${escapeHtml(node.type)} · ${escapeHtml(layer?.name ?? "—")} · ${escapeHtml(node.filePath ?? "")}</small></button>`;
        })
        .join("")
    : state.query
      ? `<p class="muted" style="padding:0 12px">No nodes for “${escapeHtml(state.query)}”.</p>`
      : `<p class="muted" style="padding:0 12px">Try a chip or type a function name.</p>`;

  root.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle("active", chip.getAttribute("data-q") === state.query);
  });

  root.querySelector("#legend")!.innerHTML = state.graph.layers
    .map((layer) => `<span><i class="swatch" style="background:${colorForLayer(layer)}"></i>${escapeHtml(layer.name)}</span>`)
    .join("");

  root.querySelector("#tour")!.innerHTML = state.graph.tour
    .map((step, index) => {
      return `<button class="tour-step ${state.tourIndex === index ? "active" : ""}" data-tour="${index}"><strong>${step.order}. ${escapeHtml(step.title)}</strong><br><small>${escapeHtml(step.description)}</small></button>`;
    })
    .join("");
}

function renderTourBanner(root: HTMLElement, state: State) {
  const banner = root.querySelector<HTMLElement>("#tour-banner")!;
  if (state.tourIndex === null) {
    banner.className = "tour-banner";
    banner.innerHTML = "";
    return;
  }
  const step = state.graph.tour[state.tourIndex];
  banner.className = "tour-banner on";
  banner.innerHTML = `
    <strong>Tour ${step.order} / ${state.graph.tour.length} — ${escapeHtml(step.title)}</strong>
    <div>${escapeHtml(step.description)}</div>
    ${step.languageLesson ? `<div class="muted" style="margin-top:6px">Language: ${escapeHtml(step.languageLesson)}</div>` : ""}
    <div class="tour-actions">
      <button type="button" data-tour-nav="prev" ${state.tourIndex === 0 ? "disabled" : ""}>Previous</button>
      <button type="button" data-tour-nav="next" ${state.tourIndex === state.graph.tour.length - 1 ? "disabled" : ""}>Next</button>
      <span class="muted">Highlights ${step.nodeIds.length} nodes</span>
    </div>
  `;
}

function renderExplain(root: HTMLElement, state: State) {
  const box = root.querySelector("#explain")!;
  if (!state.selectedId) {
    box.innerHTML = `<p class="muted">Select a node to explain it.</p>`;
    return;
  }
  const report = explainNode(state.graph, state.selectedId, fixtureSources);
  if (!report) {
    box.innerHTML = `<p class="muted">Unknown node.</p>`;
    return;
  }
  const { node } = report;
  const src = report.source ? snippet(report.source.text, report.source.start, Math.min(report.source.end, report.source.start + 14)) : "";
  box.innerHTML = `
    <p class="kicker">${escapeHtml(node.type)} · ${escapeHtml(report.layer?.name ?? "unlayered")}</p>
    <h3>${escapeHtml(node.name)}</h3>
    <p>${escapeHtml(node.summary)}</p>
    <div class="kv">
      <span>${escapeHtml(node.complexity)}</span>
      ${node.tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}
      ${node.filePath ? `<span>${escapeHtml(node.filePath)}</span>` : ""}
    </div>
    ${node.languageNotes ? `<p class="muted">${escapeHtml(node.languageNotes)}</p>` : ""}
    <p class="kicker">Calls / imports / tests</p>
    <div>${[...report.outgoing, ...report.incoming].slice(0, 10).map((row) => {
      const dir = report.outgoing.includes(row) ? "→" : "←";
      return `<button class="edge" data-id="${escapeAttr(row.node.id)}">${dir} <code>${escapeHtml(row.edge.type)}</code> ${escapeHtml(row.node.name)}${row.edge.description ? `<br><small>${escapeHtml(row.edge.description)}</small>` : ""}</button>`;
    }).join("") || `<p class="muted">No edges.</p>`}</div>
    ${src ? `<p class="kicker">Source · ${escapeHtml(report.source?.path ?? "")}</p><pre>${escapeHtml(src)}</pre>` : ""}
  `;
}

function renderImpact(root: HTMLElement, state: State) {
  const box = root.querySelector("#impact")!;
  const options = [`<option value="">Pick a sample change…</option>`]
    .concat(state.diffs.map((sample) => `<option value="${sample.id}" ${sample.id === state.diffId ? "selected" : ""}>${escapeHtml(sample.title)}</option>`))
    .join("");

  if (!state.impact) {
    box.innerHTML = `
      <p class="kicker">Diff impact · /understand-diff</p>
      <h3>What would this change touch?</h3>
      <p class="muted">Same 1-hop walk as the upstream skill: changed filePath nodes, then imports / calls / contains / tested_by neighbors, then layers + tests.</p>
      <select class="diff-pick" id="diff-pick">${options}</select>
    `;
    return;
  }

  const sample = state.diffs.find((item) => item.id === state.diffId)!;
  const list = (nodes: GraphNode[], kind: string) =>
    nodes
      .slice(0, 10)
      .map((node) => `<button class="impact-item" data-id="${escapeAttr(node.id)}"><strong>${escapeHtml(node.name)}</strong><br><small>${kind} · ${escapeHtml(node.type)} · ${escapeHtml(node.filePath ?? "")}</small></button>`)
      .join("");

  box.innerHTML = `
    <p class="kicker">Diff impact · /understand-diff</p>
    <h3>${escapeHtml(sample.title)} <span class="risk ${state.impact.risk}">${state.impact.risk} risk</span></h3>
    <select class="diff-pick" id="diff-pick">${options}</select>
    <p>${escapeHtml(sample.summary)}</p>
    <pre>${escapeHtml(sample.patch)}</pre>
    <p class="muted">${escapeHtml(sample.riskNote)}</p>
    <p class="kicker">Changed</p>
    ${list(state.impact.changed, "changed")}
    <p class="kicker">Affected (1-hop)</p>
    ${list(state.impact.affected, "affected")}
    <p class="kicker">Tests to re-run</p>
    ${list(state.impact.tests, "test")}
    <ul>${state.impact.reasons.map((reason) => `<li class="muted">${escapeHtml(reason)}</li>`).join("")}</ul>
  `;
}

function renderGraph(svg: SVGSVGElement, state: State, positions: Map<string, LayoutNode>) {
  const tourIds = new Set(state.tourIndex !== null ? state.graph.tour[state.tourIndex]?.nodeIds ?? [] : []);
  const changed = new Set(state.impact?.overlay.changedNodeIds ?? []);
  const affected = new Set(state.impact?.overlay.affectedNodeIds ?? []);
  const selected = state.selectedId;
  const neighborIds = new Set<string>();
  if (selected) {
    for (const edge of state.graph.edges) {
      if (edge.source === selected) neighborIds.add(edge.target);
      if (edge.target === selected) neighborIds.add(edge.source);
    }
  }

  const visibleEdges = state.graph.edges.filter((edge) => {
    if (edge.type === "contains" && edge.source.startsWith("module:")) return false;
    return positions.has(edge.source) && positions.has(edge.target);
  });

  const lines = visibleEdges
    .map((edge) => {
      const a = positions.get(edge.source)!;
      const b = positions.get(edge.target)!;
      const hot = selected && (edge.source === selected || edge.target === selected);
      const cls = [
        "edge-line",
        hot ? "hot" : "",
        changed.has(edge.source) || changed.has(edge.target) ? "changed" : "",
        affected.has(edge.source) || affected.has(edge.target) ? "affected" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const midX = (a.x + b.x) / 2 + (a.y - b.y) * 0.08;
      const midY = (a.y + b.y) / 2 + (b.x - a.x) * 0.08;
      return `<path class="${cls}" d="M ${a.x} ${a.y} Q ${midX} ${midY} ${b.x} ${b.y}" />`;
    })
    .join("");

  const nodes = state.graph.nodes
    .filter((node) => positions.has(node.id) && node.type !== "module")
    .map((node) => {
      const pos = positions.get(node.id)!;
      const layer = state.graph.layers.find((item) => item.nodeIds.includes(node.id));
      const color = colorForLayer(layer);
      const dim = Boolean(selected) && node.id !== selected && !neighborIds.has(node.id) && !tourIds.has(node.id) && !changed.has(node.id) && !affected.has(node.id);
      const cls = [
        "node",
        node.id === selected ? "selected" : "",
        dim ? "dim" : "",
        tourIds.has(node.id) ? "tour" : "",
        changed.has(node.id) ? "changed" : "",
        affected.has(node.id) ? "affected" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const shape = shapeFor(node.type, pos, color);
      const showLabel =
        node.type !== "function" ||
        node.id === selected ||
        neighborIds.has(node.id) ||
        tourIds.has(node.id) ||
        changed.has(node.id) ||
        affected.has(node.id);
      const label = node.name.length > 24 ? `${node.name.slice(0, 22)}…` : node.name;
      const text = showLabel
        ? `<text class="node-label" x="${pos.x + pos.r + 6}" y="${pos.y + 4}">${escapeHtml(label)}</text>`
        : "";
      return `<g class="${cls}" data-node="${escapeAttr(node.id)}"><title>${escapeHtml(node.type)} · ${escapeHtml(node.name)}</title>${shape}${text}</g>`;
    })
    .join("");

  const layerTitles = state.graph.layers
    .map((layer, index) => {
      const x = 150 + index * 300;
      return `<text x="${x}" y="36" fill="${colorForLayer(layer)}" font-size="13" font-weight="600">${escapeHtml(layer.name)}</text>`;
    })
    .join("");

  svg.innerHTML = `<g class="viewport">${layerTitles}${lines}${nodes}</g>`;
  applyPan(svg, state);
}

function shapeFor(type: string, pos: LayoutNode, color: string): string {
  if (type === "file" || type === "document") {
    return `<rect x="${pos.x - pos.r}" y="${pos.y - pos.r * 0.75}" width="${pos.r * 2}" height="${pos.r * 1.5}" rx="4" fill="${color}" />`;
  }
  if (type === "endpoint") {
    const r = pos.r;
    return `<polygon points="${pos.x},${pos.y - r} ${pos.x + r},${pos.y} ${pos.x},${pos.y + r} ${pos.x - r},${pos.y}" fill="${color}" />`;
  }
  if (type === "class") {
    return `<rect x="${pos.x - pos.r}" y="${pos.y - pos.r}" width="${pos.r * 2}" height="${pos.r * 2}" rx="3" fill="${color}" />`;
  }
  return `<circle cx="${pos.x}" cy="${pos.y}" r="${pos.r}" fill="${color}" />`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] ?? ch);
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}
