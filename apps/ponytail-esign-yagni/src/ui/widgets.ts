import { CODEBASE } from "../data/codebase";
import { escapeHtml } from "../lib/html";
import { ENVELOPE, type WidgetState } from "../state";

function envelopeChrome(inner: string, stamp: string): string {
  return `
    <article class="envelope">
      <header>
        <span class="env-id">${escapeHtml(ENVELOPE.id)}</span>
        <span class="env-stamp">${escapeHtml(stamp)}</span>
      </header>
      <h3>${escapeHtml(ENVELOPE.title)}</h3>
      <p class="env-meta">${escapeHtml(ENVELOPE.parties)} · ${escapeHtml(ENVELOPE.signer)}</p>
      <div class="env-widget">${inner}</div>
      <footer>
        <span class="sign-line"></span>
        <span>Sign</span>
      </footer>
    </article>
  `;
}

function calendarGrid(selected: string): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: string[] = [];
  for (let i = 0; i < first; i++) cells.push(`<span></span>`);
  for (let d = 1; d <= days; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const future = iso > today.toISOString().slice(0, 10);
    const on = iso === selected;
    cells.push(
      `<button type="button" data-date="${iso}" class="${on ? "is-on" : ""}" ${future ? "disabled" : ""}>${d}</button>`,
    );
  }
  return `<div class="cal-grid">${cells.join("")}</div>`;
}

export function renderPreview(ticketId: string, side: "normal" | "pony", widgets: WidgetState): string {
  const stamp = side === "normal" ? "Normal agent" : "Ponytail";
  if (ticketId === "signing-date") {
    const inner =
      side === "normal"
        ? `
          <p class="widget-kicker">react-datepicker + date-fns-tz</p>
          <div class="fake-picker">
            <div class="fake-picker-bar">Pick signing date</div>
            ${calendarGrid(widgets.signedOn)}
          </div>
        `
        : `
          <label class="stack">
            Signing date
            <input type="date" required max="${new Date().toISOString().slice(0, 10)}" aria-label="Signing date" data-date-native value="${escapeHtml(widgets.signedOn)}" />
          </label>
          ${widgets.signedOn ? `<p class="hint">Stored as ${escapeHtml(widgets.signedOn)}</p>` : `<p class="hint">Native control. Future dates blocked.</p>`}
        `;
    return envelopeChrome(inner, stamp);
  }

  if (ticketId === "initials-color") {
    const inner =
      side === "normal"
        ? `
          <p class="widget-kicker">react-colorful + tinycolor2</p>
          <div class="wheel-demo">
            <div class="wheel-disc" style="--ink:${escapeHtml(widgets.color)}"></div>
            <div class="wheel-fields">
              <input aria-label="Hex" value="${escapeHtml(widgets.color)}" data-color-hex />
              <div class="rgb-row">
                <span>R</span><span>G</span><span>B</span>
              </div>
            </div>
          </div>
          <input class="initials-input" maxlength="8" value="${escapeHtml(widgets.initials)}" data-initials />
        `
        : `
          <fieldset class="stack">
            <legend>Signer mark</legend>
            <label>
              Initials
              <input required maxlength="4" aria-label="Signer initials" value="${escapeHtml(widgets.initials)}" data-initials />
            </label>
            <label>
              Color
              <input type="color" aria-label="Initials color" value="${escapeHtml(widgets.color)}" data-color />
            </label>
          </fieldset>
          <p class="mark-preview" style="color:${escapeHtml(widgets.color)}">${escapeHtml(widgets.initials || "—")}</p>
        `;
    return envelopeChrome(inner, stamp);
  }

  if (ticketId === "reminders") {
    const inner =
      side === "normal"
        ? `
          <p class="widget-kicker">croner · ReminderEngine</p>
          <label class="stack">Cron days
            <input value="1,3,7" readonly />
          </label>
          <pre class="cron-out">0 9 */1 * *
0 9 */3 * *
0 9 */7 * *</pre>
          <button type="button" class="btn ghost" data-remind>Register jobs</button>
        `
        : `
          <p class="widget-kicker">lib/reminders.ts already exists</p>
          <p class="preset">REMINDER_PRESETS.standard = [1, 3, 7]</p>
          <button type="button" class="btn solid" data-remind>
            ${widgets.remindersOn ? "Standard reminders on" : "Enable standard reminders"}
          </button>
          ${widgets.remindersOn ? `<p class="hint" role="status">scheduleReminders("${ENVELOPE.id}", [1, 3, 7])</p>` : ""}
        `;
    return envelopeChrome(inner, stamp);
  }

  if (ticketId === "cc-list") {
    const chips = widgets.cc
      .map(
        (email) =>
          `<li>${escapeHtml(email)} <button type="button" data-cc-remove="${escapeHtml(email)}" aria-label="Remove ${escapeHtml(email)}">×</button></li>`,
      )
      .join("");
    const inner =
      side === "normal"
        ? `
          <p class="widget-kicker">email-validator + Rfc5322</p>
          <ul class="chips">${chips || `<li class="empty">No chips</li>`}</ul>
          <div class="row">
            <input data-cc-draft value="${escapeHtml(widgets.ccDraft)}" placeholder="Name &lt;cc@acme.test&gt;" />
            <button type="button" class="btn ghost" data-cc-add>Add chip</button>
          </div>
        `
        : `
          <p class="widget-kicker">RecipientList role=&quot;cc&quot;</p>
          <ul class="recipient-list">${chips || `<li class="empty">No CC yet — same list as signers</li>`}</ul>
          <div class="row">
            <input data-cc-draft value="${escapeHtml(widgets.ccDraft)}" placeholder="cc@harbor.local" aria-label="CC email" />
            <button type="button" class="btn solid" data-cc-add>Add CC</button>
          </div>
        `;
    return envelopeChrome(inner, stamp);
  }

  const days = Math.ceil((Date.parse(ENVELOPE.expiresAt) - Date.now()) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const inner =
    side === "normal"
      ? `
        <p class="widget-kicker">react-countdown + moment-timezone</p>
        <div class="flip" data-flip>
          <span>00d</span><span>00h</span><span>00m</span><span>00s</span>
        </div>
      `
      : `
        <p class="widget-kicker">Intl.RelativeTimeFormat</p>
        <p class="expiry" aria-live="polite">Expires ${escapeHtml(days < 0 ? "Expired" : rtf.format(days, "day"))}</p>
      `;
  return envelopeChrome(inner, stamp);
}

export function renderCodebaseShelf(already: string[]): string {
  const hits = new Set(already);
  return `
    <section class="shelf">
      <h2>Already in the repo</h2>
      <ul>
        ${CODEBASE.files
          .map((file) => {
            const hot = hits.size === 0
              ? false
              : already.some((hint) => hint.includes(file.path) || file.exports.some((ex) => hint.includes(ex)));
            return `<li class="${hot ? "is-hot" : ""}">
              <code>${escapeHtml(file.path)}</code>
              <span>${escapeHtml(file.blurb)}</span>
            </li>`;
          })
          .join("")}
      </ul>
    </section>
  `;
}
