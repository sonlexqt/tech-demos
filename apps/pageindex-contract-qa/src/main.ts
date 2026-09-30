import { cannedQueries } from "./data/qa";
import { meta, tree } from "./data/contract";
import type { QueryResult, TreeNode } from "./types";
import { findNode } from "./tree";
import { answerQuestion, liveKeysPresent } from "./walk";

const treeRoot = document.querySelector("#tree-root") as HTMLElement;
const docPages = document.querySelector("#doc-pages") as HTMLElement;
const docScroll = document.querySelector("#doc-scroll") as HTMLElement;
const docMeta = document.querySelector("#doc-meta") as HTMLElement;
const docTitle = document.querySelector("#doc-title") as HTMLElement;
const docParties = document.querySelector("#doc-parties") as HTMLElement;
const pageIndicator = document.querySelector("#doc-page-indicator") as HTMLElement;
const chips = document.querySelector("#chips") as HTMLElement;
const askForm = document.querySelector("#ask-form") as HTMLFormElement;
const askInput = document.querySelector("#ask-input") as HTMLTextAreaElement;
const walkLog = document.querySelector("#walk-log") as HTMLOListElement;
const answerCard = document.querySelector("#answer-card") as HTMLElement;
const btnClear = document.querySelector("#btn-clear") as HTMLButtonElement;
const btnLive = document.querySelector("#btn-live") as HTMLButtonElement;
const btnFixture = document.querySelector("#btn-fixture") as HTMLButtonElement;
const modeBadge = document.querySelector("#mode-badge") as HTMLElement;

let walkToken = 0;
const liveOk = liveKeysPresent();

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderMeta(): void {
  docTitle.textContent = meta.title;
  docParties.textContent = `${meta.parties.map((p) => `${p.name} (${p.role})`).join(" · ")} · Effective ${meta.effectiveDate}`;
  docMeta.innerHTML = [
    `<span><strong>${escapeHtml(meta.shortTitle)}</strong></span>`,
    `<span>ID ${escapeHtml(meta.agreementId)}</span>`,
    `<span>${meta.pageCount} pages</span>`,
    `<span>${escapeHtml(meta.status)}</span>`,
  ].join("");
}

function renderMode(): void {
  btnFixture.classList.add("is-on");
  if (liveOk) {
    btnLive.disabled = false;
    btnLive.title = "Optional live PageIndex/LLM path is not wired in this offline demo";
    btnLive.addEventListener("click", () => {
      modeBadge.textContent = "Live unavailable in demo";
      modeBadge.className = "badge badge-off";
      answerCard.classList.remove("is-empty");
      answerCard.innerHTML = `<h3>Live mode</h3><p class="live-note">Keys were detected, but this demo keeps the happy path on the fixture tree so reviewers can run it offline. Point a real integration at <a href="https://github.com/VectifyAI/PageIndex" target="_blank" rel="noreferrer">VectifyAI/PageIndex</a> with PAGEINDEX / OpenAI keys — never commit secrets.</p>`;
    });
  } else {
    btnLive.disabled = true;
    btnLive.title =
      "Disabled: set VITE_PAGEINDEX_API_KEY and VITE_OPENAI_API_KEY to enable the Live placeholder";
  }
}

function renderTree(nodes: TreeNode[], depth = 0): string {
  const items = nodes
    .map((node) => {
      const children = node.nodes?.length ? renderTree(node.nodes, depth + 1) : "";
      const open = depth < 1 ? " open" : "";
      return `<details class="tree-node" data-node="${node.node_id}"${open}>
        <summary title="${escapeHtml(node.summary)}">
          <span class="tree-id">${node.node_id}</span>
          <span>${escapeHtml(node.title)}</span>
        </summary>
        ${children}
      </details>`;
    })
    .join("");
  return depth === 0 ? items : `<div class="tree-children">${items}</div>`;
}

function pagesFromTree(nodes: TreeNode[]): Map<number, TreeNode[]> {
  const map = new Map<number, TreeNode[]>();
  const walk = (list: TreeNode[]) => {
    for (const node of list) {
      const page = node.start_index;
      const bucket = map.get(page) ?? [];
      bucket.push(node);
      map.set(page, bucket);
      if (node.nodes?.length) walk(node.nodes);
    }
  };
  walk(nodes);
  return map;
}

function renderDocument(): void {
  const byPage = pagesFromTree(tree);
  const pages: string[] = [];
  for (let page = 1; page <= meta.pageCount; page += 1) {
    const nodes = byPage.get(page) ?? [];
    const unique = nodes.filter((node, i, arr) => {
      if (node.nodes?.length && node.text.length < 80) return false;
      return arr.findIndex((n) => n.node_id === node.node_id) === i;
    });
    const body = unique
      .map((node) => {
        return `<article class="clause" id="clause-${node.node_id}" data-node="${node.node_id}">
          <h3>${escapeHtml(node.title)}</h3>
          ${node.text}
        </article>`;
      })
      .join("");
    pages.push(`<section class="page" data-page="${page}" id="page-${page}">
      <div class="page-running"><span>LUM-MSA-2026-1041 · Confidential</span><span>Master Services Agreement</span></div>
      ${body}
      <div class="page-footer"><span>Lumin Sign, Inc. / Acme Holdings LLC</span><span>${page}</span></div>
    </section>`);
  }
  docPages.innerHTML = pages.join("");
}

function renderChips(): void {
  chips.innerHTML = cannedQueries
    .map(
      (q) =>
        `<button type="button" class="chip" data-id="${q.id}">${escapeHtml(q.label)}</button>`,
    )
    .join("");
}

function clearHighlights(): void {
  treeRoot.querySelectorAll(".tree-node").forEach((el) => {
    el.classList.remove("is-path", "is-active", "is-hit", "is-walking");
  });
  docPages.querySelectorAll(".clause.is-hit").forEach((el) => el.classList.remove("is-hit"));
  docPages.querySelectorAll(".page.is-target").forEach((el) => el.classList.remove("is-target"));
  docPages.querySelectorAll(".excerpt-mark").forEach((el) => {
    const parent = el.parentElement;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(el.textContent ?? ""), el);
    parent.normalize();
  });
}

function expandPath(ids: string[]): void {
  for (const id of ids) {
    const details = treeRoot.querySelector(`[data-node="${id}"]`) as HTMLDetailsElement | null;
    if (details) details.open = true;
  }
}

function markExcerpt(node: TreeNode): void {
  const article = document.querySelector(`#clause-${node.node_id}`);
  if (!article) return;
  const excerpt = node.excerpt.trim();
  if (!excerpt) return;
  const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
  let current: Node | null = walker.nextNode();
  while (current) {
    const text = current.textContent ?? "";
    const idx = text.toLowerCase().indexOf(excerpt.slice(0, 48).toLowerCase());
    if (idx >= 0) {
      const range = document.createRange();
      range.setStart(current, idx);
      range.setEnd(current, Math.min(text.length, idx + excerpt.length));
      const mark = document.createElement("mark");
      mark.className = "excerpt-mark";
      try {
        range.surroundContents(mark);
      } catch {
        mark.textContent = text.slice(idx, Math.min(text.length, idx + excerpt.length));
        range.deleteContents();
        range.insertNode(mark);
      }
      break;
    }
    current = walker.nextNode();
  }
}

function updatePagePill(): void {
  const pages = [...docPages.querySelectorAll<HTMLElement>(".page")];
  const top = docScroll.scrollTop + 80;
  let current = 1;
  for (const page of pages) {
    if (page.offsetTop <= top) current = Number(page.dataset.page ?? "1");
  }
  pageIndicator.textContent = `p.${current} / ${meta.pageCount}`;
}

async function playWalk(result: QueryResult): Promise<void> {
  const token = ++walkToken;
  clearHighlights();
  walkLog.innerHTML = "";
  answerCard.classList.add("is-empty");
  answerCard.innerHTML = `<p class="answer-empty">Walking the tree index…</p>`;

  const ids = result.steps.map((s) => s.node_id);
  expandPath(ids);

  for (let i = 0; i < result.steps.length; i += 1) {
    if (token !== walkToken) return;
    const step = result.steps[i];
    const nodeEl = treeRoot.querySelector(`[data-node="${step.node_id}"]`);
    treeRoot.querySelectorAll(".is-walking, .is-active").forEach((el) => {
      el.classList.remove("is-walking", "is-active");
    });
    nodeEl?.classList.add("is-path", "is-active", "is-walking");
    nodeEl?.scrollIntoView({ block: "nearest" });

    const li = document.createElement("li");
    li.className = "is-current";
    const title = findNode(tree, step.node_id)?.title ?? step.node_id;
    li.innerHTML = `<strong>${escapeHtml(title)}</strong> — ${escapeHtml(step.reason)}`;
    walkLog.querySelectorAll("li").forEach((item) => item.classList.remove("is-current"));
    walkLog.append(li);
    walkLog.scrollTop = walkLog.scrollHeight;

    const clause = document.querySelector(`#clause-${step.node_id}`);
    clause?.scrollIntoView({ behavior: "smooth", block: "center" });
    await delay(520);
  }

  if (token !== walkToken) return;

  for (const node of result.path) {
    treeRoot.querySelector(`[data-node="${node.node_id}"]`)?.classList.add("is-path");
  }
  const hit = treeRoot.querySelector(`[data-node="${result.highlightNode.node_id}"]`);
  hit?.classList.add("is-hit", "is-active");
  const clause = document.querySelector(`#clause-${result.highlightNode.node_id}`);
  clause?.classList.add("is-hit");
  const page = clause?.closest(".page");
  page?.classList.add("is-target");
  markExcerpt(result.highlightNode);
  clause?.scrollIntoView({ behavior: "smooth", block: "center" });

  answerCard.classList.remove("is-empty");
  answerCard.innerHTML = `
    <h3>Answer</h3>
    <p>${escapeHtml(result.answer)}</p>
    <p class="citation"><strong>Tree path:</strong> ${escapeHtml(result.citation)}</p>
  `;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function runQuestion(question: string, cannedId?: string): Promise<void> {
  askInput.value = question;
  chips.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle("is-on", (chip as HTMLElement).dataset.id === cannedId);
  });
  const result = answerQuestion(question);
  if (!result) {
    walkLog.innerHTML = "";
    answerCard.classList.remove("is-empty");
    answerCard.innerHTML = `<h3>No confident node</h3><p>The fixture walker did not find a strong tree match. Try a canned chip or name a clause (liability, confidentiality, termination, subprocessors, deliverables, Delaware).</p>`;
    return;
  }
  await playWalk(result);
}

function bind(): void {
  chips.addEventListener("click", (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>(".chip");
    if (!btn) return;
    const canned = cannedQueries.find((q) => q.id === btn.dataset.id);
    if (!canned) return;
    void runQuestion(canned.question, canned.id);
  });

  askForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void runQuestion(askInput.value);
  });

  btnClear.addEventListener("click", () => {
    walkToken += 1;
    askInput.value = "";
    walkLog.innerHTML = "";
    chips.querySelectorAll(".chip").forEach((chip) => chip.classList.remove("is-on"));
    clearHighlights();
    answerCard.classList.add("is-empty");
    answerCard.innerHTML = `<p class="answer-empty">Pick a chip or ask a question. The walker will step through the TOC, highlight the clause, and cite the tree path.</p>`;
  });

  treeRoot.addEventListener("click", (event) => {
    const summary = (event.target as HTMLElement).closest("summary");
    if (!summary) return;
    const details = summary.parentElement as HTMLDetailsElement | null;
    const id = details?.dataset.node;
    if (!id) return;
    const clause = document.querySelector(`#clause-${id}`);
    clause?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  docScroll.addEventListener("scroll", updatePagePill, { passive: true });
}

function boot(): void {
  renderMeta();
  renderMode();
  treeRoot.innerHTML = renderTree(tree);
  renderDocument();
  renderChips();
  bind();
  updatePagePill();
}

boot();
