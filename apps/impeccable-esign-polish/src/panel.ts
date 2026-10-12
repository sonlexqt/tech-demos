import { COMMANDS, commandLabel } from "./commands";
import type { CommandId, DemoFinding, DetectSource } from "./types";

export function renderFindingList(findings: DemoFinding[], fixed: Set<string>, selected: string | null): string {
  if (findings.length === 0) {
    return `<p class="empty">Run the detector to load findings from <code>npx impeccable detect</code>.</p>`;
  }

  const open = findings.filter((f) => !fixed.has(f.id));
  const cleared = findings.filter((f) => fixed.has(f.id));

  return `
    <ul class="finding-list">
      ${open.map((f) => findingCard(f, selected, false)).join("")}
      ${cleared.length ? `<li class="cleared-label">Cleared</li>` : ""}
      ${cleared.map((f) => findingCard(f, selected, true)).join("")}
    </ul>
  `;
}

function findingCard(f: DemoFinding, selected: string | null, isFixed: boolean): string {
  const instanceNote =
    f.instances.length > 1 ? `${f.instances.length} hits` : f.instances[0]?.snippet ?? "";
  return `
    <li>
      <article class="finding ${selected === f.id ? "is-selected" : ""} ${isFixed ? "is-fixed" : ""}" data-finding="${f.id}">
        <header>
          <code class="rule-id">${f.id}</code>
          <span class="sev sev-${f.severity}">${f.severity}</span>
          <span class="cat">${f.category}</span>
        </header>
        <h3>${escapeHtml(f.name)}</h3>
        <p class="where"><span>${escapeHtml(f.element)}</span> · ${escapeHtml(instanceNote)}</p>
        <p class="why">${escapeHtml(f.whyEsign)}</p>
        <p class="cmd">${commandLabel(f.command)}</p>
        <footer>
          ${
            isFixed
              ? `<span class="done">Cleared</span>`
              : `<button type="button" class="apply" data-apply="${f.id}">${escapeHtml(f.fixLabel)}</button>`
          }
        </footer>
      </article>
    </li>
  `;
}

export function renderCommands(active: Set<CommandId>, satisfied: Set<CommandId>): string {
  return `
    <ul class="cmd-grid">
      ${COMMANDS.map((c) => {
        const state = active.has(c.id) ? "is-active" : satisfied.has(c.id) ? "is-done" : "";
        return `
          <li class="cmd-cell ${state}" title="${escapeHtml(c.summary)}">
            <code>/impeccable ${c.id}</code>
            <span>${escapeHtml(c.summary)}</span>
          </li>
        `;
      }).join("")}
    </ul>
  `;
}

export function sourceLabel(source: DetectSource | null, note?: string, rawCount = 0): string {
  if (!source) return "Detector idle";
  if (source === "cli") {
    return `Live CLI · ${rawCount} raw findings from npx impeccable detect --json`;
  }
  return `Captured fixture · ${rawCount} raw findings${note ? ` · ${note}` : ""}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
