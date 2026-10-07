import masterSource from "../design-system/lumin-sign/MASTER.md?raw";
import industryFilters from "../design-system/lumin-sign/industry-filters.json";
import { colorMap, parseMaster } from "./parse-master";
import { restylePage, signatureDialog, slopPage } from "./pages";
import type { AuditRule, DesignSystem, IndustryFilters, RuleId } from "./types";
import "./styles.css";

const filters = industryFilters as IndustryFilters;
const ds = parseMaster(masterSource);

const RULES: AuditRule[] = [
  { id: "emoji", label: "No emojis used as icons", hint: "Off: Lucide-style SVGs swap to emoji." },
  { id: "iconset", label: "Icons from one consistent set", hint: "Off: icons tint pink and skew." },
  { id: "pointer", label: "cursor-pointer on clickable elements", hint: "Off: cursors go default." },
  { id: "hover", label: "Hover transitions 150–300ms", hint: "Off: hovers snap with no easing." },
  { id: "contrast", label: "Light mode text contrast 4.5:1", hint: "Off: slate-on-slate washout." },
  { id: "focus", label: "Visible keyboard focus", hint: "Off: focus rings disappear. Tab to test." },
  { id: "motion", label: "prefers-reduced-motion respected", hint: "Off: pending row bounces forever." },
  { id: "responsive", label: "Reflow at 375 / 768 / 1024 / 1440", hint: "Off: the page refuses to wrap." },
  { id: "navbar", label: "No content hidden behind the header", hint: "Off: sticky header covers the title." },
  { id: "scroll", label: "No horizontal scroll on narrow view", hint: "Off: MSA lines stop wrapping." },
  { id: "purple", label: "No AI purple/pink gradients (legal/finance filter)", hint: "Off: the restyle eats the slop palette." },
];

const BREAKPOINTS = [375, 768, 1024, 1440] as const;

const state = {
  passed: new Set<RuleId>(RULES.map((rule) => rule.id)),
  breakpoint: 1024 as (typeof BREAKPOINTS)[number],
  reducedSim: false,
  signature: "",
  signed: false,
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function swatches(design: DesignSystem): string {
  return design.colors
    .map(
      (token) => `
        <div class="swatch">
          <span class="chip" style="background:${token.hex}"></span>
          <span>${escapeHtml(token.role)} <code>${escapeHtml(token.hex)}</code></span>
        </div>`,
    )
    .join("");
}

function antiList(): string {
  const fromMaster = ds.antiPatterns.filter((item) => !/emoji|cursor|contrast|focus|layout-shifting|instant state/i.test(item));
  const industry = filters.rows
    .filter((row) => row.id !== 175)
    .flatMap((row) => row.antiPatterns.map((item) => `${item} <em>(${escapeHtml(row.category)})</em>`));
  const unique = [...fromMaster.map(escapeHtml), ...industry];
  return unique.map((item) => `<li>${item}</li>`).join("");
}

function rulesHtml(): string {
  return RULES.map((rule) => {
    const on = state.passed.has(rule.id);
    return `
      <label class="rule">
        <input type="checkbox" data-rule="${rule.id}" ${on ? "checked" : ""} />
        <span>${escapeHtml(rule.label)}<small>${escapeHtml(rule.hint)}</small></span>
      </label>`;
  }).join("");
}

function chrome(): string {
  const failed = RULES.length - state.passed.size;
  return `
    <header class="chrome-top">
      <div class="chrome-brand">
        <img src="/favicon.svg" alt="" width="32" height="32" />
        <div>
          <h1>UI/UX Pro Max · Lumin Sign restyle</h1>
          <p>Same MSA countersign page. Left is generic AI slop. Right follows the committed design system.</p>
        </div>
      </div>
      <div class="chrome-links">
        <span class="pill">Fixture <code>MASTER.md</code></span>
        <span class="pill"><a href="https://github.com/nextlevelbuilder/ui-ux-pro-max-skill" target="_blank" rel="noreferrer">Upstream skill</a></span>
        <span class="pill"><a href="./HOW_IT_WORKS.md" target="_blank" rel="noreferrer">How it works</a></span>
      </div>
    </header>
    <p class="lede">
      The skill searched its catalog (192 industry rules, 79 styles, 192 palettes, 74 font pairings)
      for <strong>e-signature / legal SaaS</strong> and persisted
      <strong>${escapeHtml(ds.patternName)}</strong>,
      <strong>${escapeHtml(ds.headingFont)} / ${escapeHtml(ds.bodyFont)}</strong>,
      and a navy + signature-green palette. Toggle the audit checklist — the restyled page passes or fails in place.
    </p>
    <div class="workspace">
      <section class="col">
        <div class="col-h">
          <h2 class="tag-slop">Before · generic AI slop</h2>
          <span class="pill">Purple gradients · hidden consent</span>
        </div>
        <div class="frame">${slopPage()}</div>
      </section>
      <section class="col">
        <div class="col-h">
          <h2 class="tag-pass">After · skill restyle</h2>
          <div class="bp-bar" role="group" aria-label="Preview width">
            ${BREAKPOINTS.map(
              (bp) =>
                `<button type="button" data-bp="${bp}" aria-pressed="${String(state.breakpoint === bp)}">${bp}</button>`,
            ).join("")}
          </div>
        </div>
        <div class="frame frame-restyle" id="restyle-frame">
          <div class="scale-stage">
            <div class="scale-inner" id="scale-inner" style="width:${state.breakpoint}px">
              ${restylePage()}
              ${signatureDialog()}
            </div>
          </div>
        </div>
      </section>
      <aside class="panel" id="panel">
        <h2>Design system</h2>
        <p class="meta">
          ${escapeHtml(ds.project)} · ${escapeHtml(ds.category)}<br />
          Generated ${escapeHtml(ds.generated)} · committed fixture
        </p>
        <h3>Page pattern</h3>
        <p><strong>${escapeHtml(ds.patternName)}</strong> · ${escapeHtml(ds.style)}</p>
        <p>${escapeHtml(ds.conversion)}</p>
        <h3>Palette</h3>
        <div class="swatches">${swatches(ds)}</div>
        <p>${escapeHtml(ds.colorNotes)}</p>
        <h3>Fonts</h3>
        <p>
          Headings <strong>${escapeHtml(ds.headingFont)}</strong> ·
          Body <strong>${escapeHtml(ds.bodyFont)}</strong><br />
          <span>${escapeHtml(ds.typeMood)}</span>
        </p>
        <h3>Filtered anti-patterns</h3>
        <ul class="anti">${antiList()}</ul>
        <h3>Checklist audit</h3>
        <p>Each rule is on = the restyled page passes. Turn one off and watch that rule fail.</p>
        <div class="panel-actions">
          <button type="button" class="ghost" id="pass-all">Pass all</button>
          <button type="button" class="ghost" id="fail-all">Fail all</button>
        </div>
        <div class="rules">${rulesHtml()}</div>
        <label class="sim">
          <input type="checkbox" id="sim-reduced" ${state.reducedSim ? "checked" : ""} />
          Simulate <code>prefers-reduced-motion</code>
        </label>
        <p class="score" id="score">${scoreLine(failed)}</p>
      </aside>
    </div>
  `;
}

function scoreLine(failed: number): string {
  if (failed === 0) {
    return `<strong class="pass">${RULES.length}/${RULES.length} passing</strong> — restyle matches the fixture checklist.`;
  }
  return `<strong class="fail">${RULES.length - failed}/${RULES.length} passing</strong> — ${failed} rule${failed === 1 ? "" : "s"} failing on the restyle.`;
}

function applyTokens(root: HTMLElement): void {
  const tokens = colorMap(ds);
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }
  root.style.setProperty("--font-heading", `"${ds.headingFont}", Georgia, serif`);
  root.style.setProperty("--font-body", `"${ds.bodyFont}", "Segoe UI", sans-serif`);
}

function applyRules(root: HTMLElement): void {
  for (const rule of RULES) {
    root.classList.toggle(`fail-${rule.id}`, !state.passed.has(rule.id));
  }
  root.classList.toggle("sim-reduced-motion", state.reducedSim);
  root.classList.toggle("is-signed", state.signed);
}

function scaleFrame(): void {
  const stage = document.querySelector(".scale-stage") as HTMLElement | null;
  const inner = document.getElementById("scale-inner");
  if (!stage || !inner) return;
  const available = stage.clientWidth - 8;
  const width = state.breakpoint;
  const scale = Math.min(1, available / width);
  inner.style.width = `${width}px`;
  inner.style.transform = `scale(${scale})`;
  inner.style.marginBottom = scale < 1 ? `${inner.scrollHeight * (scale - 1)}px` : "0";
}

function bindSlop(app: HTMLElement): void {
  const toast = app.querySelector("[data-slop-toast]") as HTMLElement | null;
  app.querySelectorAll<HTMLButtonElement>("[data-slop-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!toast) return;
      const action = button.dataset.slopAction;
      toast.hidden = false;
      if (action === "magic") {
        toast.textContent = "🎉 You're all set!! We assumed consent. No audit row written.";
      } else if (action === "later") {
        toast.textContent = "Cool cool. The agreement is still unsigned. We will nudge you forever.";
      } else {
        toast.textContent = "Skipped the document. Legal will not love this.";
      }
    });
  });
}

function bindRestyle(app: HTMLElement): void {
  const root = app.querySelector("#restyle-root") as HTMLElement | null;
  if (!root) return;
  applyTokens(root);
  applyRules(root);

  const dialog = app.querySelector("#sig-dialog") as HTMLElement | null;
  const name = app.querySelector("#sig-name") as HTMLInputElement | null;
  const live = app.querySelector("#sig-live") as HTMLElement | null;
  const preview = app.querySelector("#sig-preview") as HTMLElement | null;
  const consent = app.querySelector("#consent-box") as HTMLInputElement | null;
  const signBtn = app.querySelector("#btn-sign") as HTMLButtonElement | null;
  const status = app.querySelector("#rs-status") as HTMLElement | null;
  const auditPending = app.querySelector("[data-audit-pending]") as HTMLElement | null;

  const refreshSignEnabled = () => {
    if (!signBtn || !consent) return;
    signBtn.disabled = state.signed || !(consent.checked && Boolean(state.signature));
  };

  const openDialog = () => {
    if (!dialog || state.signed) return;
    dialog.hidden = false;
    name?.focus();
  };

  const closeDialog = () => {
    if (dialog) dialog.hidden = true;
  };

  app.querySelector("#sig-open")?.addEventListener("click", openDialog);
  app.querySelector("#sig-cancel")?.addEventListener("click", closeDialog);
  name?.addEventListener("input", () => {
    if (live) live.textContent = name.value || " ";
  });
  app.querySelector("#sig-apply")?.addEventListener("click", () => {
    const value = name?.value.trim() || "Ada Chen";
    state.signature = value;
    if (preview) {
      preview.className = "sig-applied";
      preview.textContent = value;
    }
    closeDialog();
    refreshSignEnabled();
    if (status) {
      status.className = "rs-status";
      status.textContent = "Signature placed. Check consent to countersign.";
    }
  });

  consent?.addEventListener("change", refreshSignEnabled);

  app.querySelector("#btn-decline")?.addEventListener("click", () => {
    if (!status) return;
    status.className = "rs-status bad";
    status.textContent = "Declined. The audit trail would record a decline event in production.";
  });

  signBtn?.addEventListener("click", () => {
    if (!consent?.checked || !state.signature) return;
    state.signed = true;
    applyRules(root);
    refreshSignEnabled();
    if (status) {
      status.className = "rs-status ok";
      status.textContent = `Countersigned by ${state.signature}. Agreement executed. Audit trail updated.`;
    }
    if (auditPending) {
      auditPending.classList.remove("pending", "pulse");
      auditPending.innerHTML = `<span class="audit-time">09:31</span><span>Countersigned by ${escapeHtml(state.signature)} (Client)</span>`;
    }
    const steps = root.querySelectorAll(".rs-steps li");
    steps.forEach((step) => step.classList.add("is-done"));
  });

  refreshSignEnabled();
}

function bindPanel(app: HTMLElement): void {
  app.querySelectorAll<HTMLInputElement>("[data-rule]").forEach((input) => {
    input.addEventListener("change", () => {
      const id = input.dataset.rule as RuleId;
      if (input.checked) state.passed.add(id);
      else state.passed.delete(id);
      const root = app.querySelector("#restyle-root") as HTMLElement | null;
      if (root) applyRules(root);
      const score = app.querySelector("#score");
      if (score) score.innerHTML = scoreLine(RULES.length - state.passed.size);
    });
  });

  app.querySelector("#pass-all")?.addEventListener("click", () => {
    RULES.forEach((rule) => state.passed.add(rule.id));
    rerender();
  });
  app.querySelector("#fail-all")?.addEventListener("click", () => {
    state.passed.clear();
    rerender();
  });
  app.querySelector("#sim-reduced")?.addEventListener("change", (event) => {
    state.reducedSim = (event.target as HTMLInputElement).checked;
    const root = app.querySelector("#restyle-root") as HTMLElement | null;
    if (root) applyRules(root);
  });

  app.querySelectorAll<HTMLButtonElement>("[data-bp]").forEach((button) => {
    button.addEventListener("click", () => {
      state.breakpoint = Number(button.dataset.bp) as (typeof BREAKPOINTS)[number];
      app.querySelectorAll<HTMLButtonElement>("[data-bp]").forEach((other) => {
        other.setAttribute("aria-pressed", String(other === button));
      });
      scaleFrame();
    });
  });
}

function rerender(): void {
  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = chrome();
  bindSlop(app);
  bindRestyle(app);
  bindPanel(app);
  scaleFrame();
}

const appRoot = document.getElementById("app");
if (!appRoot) throw new Error("#app missing");
rerender();
window.addEventListener("resize", scaleFrame);
