const $ = (id) => document.getElementById(id);

function pill(ok, yes, no) {
  return `<span class="pill ${ok ? "ok" : "no"}">${ok ? yes : no}</span>`;
}

function warnPill(ok, yes, no) {
  return `<span class="pill ${ok ? "ok" : "warn"}">${ok ? yes : no}</span>`;
}

function fmt(n) {
  return Number(n).toLocaleString("en-US");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function hitPath(hit) {
  if (hit.path) return hit.path;
  if (hit.title) return hit.title;
  return "(unknown)";
}

function renderHits(el, hits, kind) {
  if (!hits?.length) {
    el.innerHTML = `<li class="empty">No hits captured.</li>`;
    return;
  }
  el.innerHTML = hits
    .map((hit, i) => {
      const loc =
        kind === "grep"
          ? `line ${hit.line ?? "?"}`
          : [hit.page != null ? `page ${hit.page}` : null, hit.score != null ? `score ${Number(hit.score).toFixed(2)}` : null]
              .filter(Boolean)
              .join(" · ");
      return `<li>
        <div class="hit-meta">
          <span class="hit-path">${i + 1}. ${escapeHtml(hitPath(hit))}</span>
          <span>${escapeHtml(loc)}</span>
        </div>
        <pre class="hit-text">${escapeHtml(hit.text || "")}</pre>
      </li>`;
    })
    .join("");
}

function renderQuestion(demo, q) {
  $("truth").hidden = false;
  $("cols").hidden = false;
  $("q-title").textContent = q.label;
  $("q-line").textContent = q.question;
  $("answer-key").textContent = q.groundTruth;

  const g = q.grep;
  const x = q.xerj;
  $("metrics").innerHTML = `
    <div class="metric"><b>${fmt(g.retrievedBytes)}</b><span>grep bytes (whole matching files)</span></div>
    <div class="metric"><b>${fmt(x.retrievedBytes)}</b><span>XERJ bytes (ranked passages)</span></div>
    <div class="metric"><b>${fmt(g.retrievedTokensEst)}</b><span>grep tokens est. (bytes/4)</span></div>
    <div class="metric"><b>${fmt(x.retrievedTokensEst)}</b><span>XERJ tokens est. (bytes/4)</span></div>
    <div class="metric"><b>${q.byteRatioGrepOverXerj ?? "—"}×</b><span>file bytes / passage bytes</span></div>
    <div class="metric"><b>${x.tookMs ?? "—"} ms</b><span>XERJ _search took</span></div>
  `;

  $("grep-score").innerHTML = [
    pill(g.correctness.containsAnswer, "Needles found", "Needles missed"),
    warnPill(g.correctness.anyPreferredFile, "Preferred file in hits", "Preferred file absent"),
    `<span class="pill warn">${g.hitCount} line hits · ${g.matchedFiles.length} files</span>`,
  ].join("");

  $("xerj-score").innerHTML = [
    pill(x.correctness.containsAnswer, "Needles found", "Needles missed"),
    warnPill(x.correctness.topHitPreferred, "Top hit is a preferred file", "Top hit is not preferred"),
    `<span class="pill warn">${x.hits.length} passages</span>`,
  ].join("");

  renderHits($("grep-hits"), g.hits, "grep");
  renderHits($("xerj-hits"), x.hits, "xerj");

  const note = $("pageindex-note");
  if (q.id === "liability-cap") {
    note.hidden = false;
    note.innerHTML = `<strong>vs PageIndex (PR #12, not loaded here).</strong> ${escapeHtml(demo.pageindexNote)}`;
  } else {
    note.hidden = true;
    note.textContent = "";
  }

  for (const btn of document.querySelectorAll(".chip")) {
    btn.setAttribute("aria-pressed", String(btn.dataset.id === q.id));
  }
}

async function main() {
  const res = await fetch("/api/demo");
  const demo = await res.json();
  $("caveat").textContent = demo.caveat;
  $("gain-text").textContent = (demo.gain?.text || "").trim() || JSON.stringify(demo.gain?.json, null, 2);
  const g = demo.gain?.json || {};
  $("gain-meta").textContent = [
    demo.library?.version || "XERJ",
    `${g.searches ?? "?"} searches served`,
    `${g.hit_rate ?? "?"}% hit rate`,
    `p50 ${g.took_ms?.p50 ?? "?"}ms`,
    "gain does not print a dollar token-savings figure on this capture — only counted usage.",
  ].join(" · ");

  const badge = $("mode-badge");
  if (demo.liveEnabled) {
    badge.textContent = "Live available";
    badge.classList.remove("fixture");
    badge.classList.add("live");
  } else {
    badge.textContent = "Fixture";
  }

  const chips = $("chips");
  for (const q of demo.questions) {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.type = "button";
    btn.dataset.id = q.id;
    btn.textContent = q.label;
    btn.addEventListener("click", () => renderQuestion(demo, q));
    chips.append(btn);
  }
  if (demo.questions[0]) renderQuestion(demo, demo.questions[0]);
}

main().catch((err) => {
  $("caveat").textContent = `Failed to load fixtures: ${err}`;
});
