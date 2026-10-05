const MODE_LABEL = {
  normal: "Normal",
  caveman: "Caveman output",
  proxy: "Proxy input",
  both: "Both",
};

const state = {
  tasks: [],
  meta: null,
  taskId: null,
  mode: "caveman",
  inputTab: "raw",
  result: null,
  payload: null,
};

const $ = (id) => document.getElementById(id);

function fmt(n) {
  return new Intl.NumberFormat("en-US").format(n);
}

function money(n) {
  if (n < 0.0001) return `$${n.toFixed(6)}`;
  if (n < 0.01) return `$${n.toFixed(5)}`;
  return `$${n.toFixed(4)}`;
}

function pct(part, whole) {
  if (!whole) return "—";
  const delta = (1 - part / whole) * 100;
  if (Math.abs(delta) < 0.05) return "0%";
  const sign = delta > 0 ? "−" : "+";
  return `${sign}${Math.abs(delta).toFixed(1)}%`;
}

async function loadMeta() {
  const meta = await (await fetch("/api/meta")).json();
  state.meta = meta;
  $("source-pill").textContent = meta.liveAvailable
    ? `Live key detected (${meta.provider})`
    : "Offline fixtures";
  $("rate-label").textContent = meta.rates.label;
  if (meta.liveAvailable) $("live-wrap").hidden = false;
}

async function loadTasks() {
  state.tasks = await (await fetch("/api/tasks")).json();
  const list = $("task-list");
  list.innerHTML = "";
  for (const [i, task] of state.tasks.entries()) {
    const btn = document.createElement("button");
    btn.className = "task";
    btn.type = "button";
    btn.dataset.id = task.id;
    btn.innerHTML = `<b>${i + 1}. ${task.title}</b><span>${task.blurb}</span>`;
    btn.addEventListener("click", () => selectTask(task.id, true));
    list.appendChild(btn);
  }
}

function selectTask(id, run) {
  state.taskId = id;
  const task = state.tasks.find((item) => item.id === id);
  for (const btn of document.querySelectorAll(".task")) {
    btn.classList.toggle("on", btn.dataset.id === id);
  }
  if (task) {
    $("task-kicker").textContent = "Lumin Sign ops replay";
    $("task-title").textContent = task.title;
    $("task-blurb").textContent = task.question;
  }
  loadPayload(id);
  if (run) replay();
}

async function loadPayload(id) {
  const data = await (await fetch(`/api/payload?task=${encodeURIComponent(id)}`)).json();
  state.payload = data;
  renderInput();
}

function renderInput() {
  if (!state.payload) return;
  const raw = state.inputTab === "raw";
  const text = raw ? state.payload.raw : state.payload.trimmed;
  $("input-view").textContent = text;
  const saved = state.payload.rawBytes - state.payload.trimmedBytes;
  const pctSaved = ((saved / state.payload.rawBytes) * 100).toFixed(1);
  $("input-meta").textContent = raw
    ? `Raw dump · ${fmt(state.payload.rawBytes)} bytes (retries, HMAC, edge-pop, health)`
    : `Proxy-trimmed · ${fmt(state.payload.trimmedBytes)} bytes (${pctSaved}% smaller). Demo compressor, not the real Caveman engine.`;
}

async function replay() {
  if (!state.taskId) return;
  const btn = $("btn-run");
  btn.disabled = true;
  $("run-status").textContent = "Replaying four diets…";
  try {
    const res = await fetch("/api/compare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        taskId: state.taskId,
        live: Boolean($("live-toggle").checked),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "compare failed");
    state.result = data;
    renderAll();
    $("run-status").textContent = data.modes.normal.source === "live" ? "Live model" : "Deterministic fixtures";
  } catch (error) {
    $("run-status").textContent = error.message;
  } finally {
    btn.disabled = false;
  }
}

function renderAll() {
  renderTokens();
  renderFacts();
  renderReplies();
  renderDiff();
}

function renderTokens() {
  const runs = state.result?.modes;
  const body = $("token-rows");
  const bars = $("token-bars");
  if (!runs) return;
  const base = runs.normal.tokens;
  body.innerHTML = "";
  let maxIn = 1;
  for (const mode of Object.keys(MODE_LABEL)) {
    maxIn = Math.max(maxIn, runs[mode].tokens.input);
  }
  bars.hidden = false;
  bars.innerHTML = "";
  for (const mode of Object.keys(MODE_LABEL)) {
    const run = runs[mode];
    const tr = document.createElement("tr");
    if (mode === state.mode) tr.className = "focus";
    const saved = pct(run.costUsd, runs.normal.costUsd);
    const cls = run.costUsd < runs.normal.costUsd ? "cut" : run.costUsd > runs.normal.costUsd ? "up" : "";
    tr.innerHTML = `
      <td>${MODE_LABEL[mode]}</td>
      <td>${fmt(run.tokens.input)}${run.tokens.skillOverhead ? ` <span class="muted">(incl. ${fmt(run.tokens.skillOverhead)} skill)</span>` : ""}</td>
      <td>${fmt(run.tokens.output)}</td>
      <td>${money(run.costUsd)}</td>
      <td class="${cls}">${mode === "normal" ? "baseline" : saved + " cost"}</td>`;
    body.appendChild(tr);

    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `<span>${MODE_LABEL[mode]}</span><span class="bar"><i style="width:${(run.tokens.input / maxIn) * 100}%"></i></span><span>${fmt(run.tokens.input)} in</span>`;
    bars.appendChild(row);
  }
}

function renderFacts() {
  const box = $("fact-table");
  if (!state.result) return;
  box.innerHTML = "";
  for (const fact of state.result.facts) {
    const row = document.createElement("div");
    row.className = "fact";
    const badges = Object.keys(MODE_LABEL)
      .map((mode) => {
        const ok = fact.inInput[mode] && fact.inOutput[mode];
        const tip = `${fact.inInput[mode] ? "in input" : "missing input"} · ${fact.inOutput[mode] ? "in output" : "missing output"}`;
        return `<span class="badge ${ok ? "ok" : "no"}" title="${tip}">${MODE_LABEL[mode]} ${ok ? "kept" : "lost"}</span>`;
      })
      .join("");
    row.innerHTML = `<div><b>${fact.label}</b><div class="tiny">${fact.needles.join(" · ")}</div></div><div class="badges">${badges}</div>`;
    box.appendChild(row);
  }
}

function renderReplies() {
  const runs = state.result?.modes;
  if (!runs) return;
  $("out-normal").textContent = runs.normal.output;
  $("normal-meta").textContent = `${fmt(runs.normal.tokens.output)} out · ${money(runs.normal.costUsd)}`;
  const focus = state.mode === "normal" ? "caveman" : state.mode;
  $("focus-title").textContent = MODE_LABEL[focus];
  $("out-focus").textContent = runs[focus].output;
  $("focus-meta").textContent = `${fmt(runs[focus].tokens.output)} out · ${money(runs[focus].costUsd)} · ${runs[focus].source}`;
}

function sentences(text) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function blockDiff(a, b) {
  const left = sentences(a);
  const right = sentences(b);
  const rightSet = new Set(right);
  const leftSet = new Set(left);
  const removed = left.filter((line) => !rightSet.has(line));
  const added = right.filter((line) => !leftSet.has(line));
  const kept = right.filter((line) => leftSet.has(line));
  const parts = [];
  if (removed.length) {
    parts.push(removed.map((line) => `<span class="del">${escapeHtml(line)}</span>`).join("\n"));
  }
  if (kept.length) {
    parts.push(kept.map((line) => escapeHtml(line)).join("\n"));
  }
  if (added.length) {
    parts.push(added.map((line) => `<span class="ins">${escapeHtml(line)}</span>`).join("\n"));
  }
  return parts.join("\n\n");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderDiff() {
  const runs = state.result?.modes;
  if (!runs) return;
  const focus = state.mode === "normal" ? "caveman" : state.mode;
  if (focus === "proxy") {
    $("diff-view").innerHTML = escapeHtml(
      "Proxy-only mode keeps the Normal reply. Input is what changed — open the inspector below.",
    );
    return;
  }
  $("diff-view").innerHTML = blockDiff(runs.normal.output, runs[focus].output);
}

function setMode(mode) {
  state.mode = mode;
  for (const btn of document.querySelectorAll(".mode")) {
    btn.classList.toggle("on", btn.dataset.mode === mode);
  }
  if (state.result) {
    renderTokens();
    renderReplies();
    renderDiff();
  }
}

$("btn-run").addEventListener("click", replay);
$("mode-switch").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-mode]");
  if (btn) setMode(btn.dataset.mode);
});
document.querySelectorAll("[data-input]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.inputTab = btn.dataset.input;
    document.querySelectorAll("[data-input]").forEach((tab) => {
      tab.classList.toggle("on", tab === btn);
    });
    renderInput();
  });
});

await loadMeta();
await loadTasks();
if (state.tasks[0]) selectTask(state.tasks[0].id, true);
