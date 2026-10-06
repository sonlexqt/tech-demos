import { createState, type AppState } from "./state";
import { render } from "./ui/render";
import type { LlmStatus, ReviewResult } from "./types";
import "./styles.css";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("#app missing");

const state = createState();
let flipTimer: number | null = null;

boot();

async function boot() {
  paint();
  state.llm = await loadStatus();
  paint();
}

function paint() {
  root!.innerHTML = render(state);
  bind(root!);
  syncFlipClock();
}

function bind(node: HTMLElement) {
  node.addEventListener("click", onClick);
  node.addEventListener("input", onInput);
  node.addEventListener("change", onChange);
  node.addEventListener("keydown", onKey);
}

function onClick(event: Event) {
  const target = (event.target as HTMLElement).closest<HTMLElement>(
    "[data-tab],[data-ticket],[data-run-review],[data-date],[data-remind],[data-cc-add],[data-cc-remove]",
  );
  if (!target) return;

  if (target.dataset.tab) {
    state.tab = target.dataset.tab as AppState["tab"];
    paint();
    return;
  }
  if (target.dataset.ticket) {
    state.ticketId = target.dataset.ticket;
    paint();
    return;
  }
  if (target.hasAttribute("data-run-review")) {
    void runReview();
    return;
  }
  if (target.dataset.date) {
    state.widgets.signedOn = target.dataset.date;
    paint();
    return;
  }
  if (target.hasAttribute("data-remind")) {
    state.widgets.remindersOn = true;
    paint();
    return;
  }
  if (target.hasAttribute("data-cc-add")) {
    addCc();
    return;
  }
  if (target.dataset.ccRemove) {
    state.widgets.cc = state.widgets.cc.filter((email) => email !== target.dataset.ccRemove);
    paint();
  }
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.matches("[data-initials]")) {
    state.widgets.initials = target.value.slice(0, 4);
    const marks = document.querySelectorAll(".mark-preview");
    marks.forEach((el) => {
      el.textContent = state.widgets.initials || "—";
    });
    return;
  }
  if (target.matches("[data-cc-draft]")) {
    state.widgets.ccDraft = target.value;
    document.querySelectorAll<HTMLInputElement>("[data-cc-draft]").forEach((el) => {
      if (el !== target) el.value = target.value;
    });
    return;
  }
  if (target.matches("[data-color-hex]") && /^#[0-9a-fA-F]{6}$/.test(target.value)) {
    state.widgets.color = target.value;
    const disc = document.querySelector<HTMLElement>(".wheel-disc");
    if (disc) disc.style.setProperty("--ink", target.value);
    const native = document.querySelector<HTMLInputElement>("[data-color]");
    if (native) native.value = target.value;
    const preview = document.querySelector<HTMLElement>(".mark-preview");
    if (preview) preview.style.color = target.value;
  }
}

function onChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.matches("[data-date-native]")) {
    state.widgets.signedOn = target.value;
    paint();
    return;
  }
  if (target.matches("[data-color]")) {
    state.widgets.color = target.value;
    paint();
  }
}

function onKey(event: KeyboardEvent) {
  const target = event.target as HTMLInputElement;
  if (event.key === "Enter" && target.matches("[data-cc-draft]")) {
    event.preventDefault();
    addCc();
  }
}

function addCc() {
  const raw = state.widgets.ccDraft.trim();
  const email = raw.includes("<") ? (raw.match(/<([^>]+)>/)?.[1] ?? raw) : raw;
  if (!email.includes("@") || !email.includes(".")) return;
  if (!state.widgets.cc.includes(email)) state.widgets.cc = [...state.widgets.cc, email];
  state.widgets.ccDraft = "";
  paint();
}

async function loadStatus(): Promise<LlmStatus> {
  try {
    const res = await fetch("/api/llm-status");
    if (!res.ok) return { live: false, provider: null };
    return (await res.json()) as LlmStatus;
  } catch {
    return { live: false, provider: null };
  }
}

async function runReview() {
  state.reviewBusy = true;
  state.reviewError = null;
  paint();
  try {
    const res = await fetch("/api/review", { method: "POST" });
    if (!res.ok) throw new Error(`review failed (${res.status})`);
    state.review = (await res.json()) as ReviewResult;
  } catch (err) {
    state.reviewError = err instanceof Error ? err.message : "Review failed";
  } finally {
    state.reviewBusy = false;
    paint();
  }
}

function syncFlipClock() {
  if (flipTimer !== null) window.clearInterval(flipTimer);
  const node = document.querySelector("[data-flip]");
  if (!node) return;

  const tick = () => {
    const target = new Date();
    target.setDate(target.getDate() + 4);
    target.setHours(17, 0, 0, 0);
    const ms = Math.max(0, target.getTime() - Date.now());
    const s = Math.floor(ms / 1000);
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    node.innerHTML = `<span>${pad(days)}d</span><span>${pad(hours)}h</span><span>${pad(mins)}m</span><span>${pad(secs)}s</span>`;
  };
  tick();
  flipTimer = window.setInterval(tick, 1000);
}
