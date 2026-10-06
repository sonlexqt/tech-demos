import { RUNGS } from "../data/rungs";
import { FIXTURE_REVIEW, OVERBUILT_BLURB, OVERBUILT_FILES, OVERBUILT_TITLE } from "../data/review";
import { TICKETS } from "../data/tickets";
import { escapeHtml, loc } from "../lib/html";
import type { AppState } from "../state";
import { renderCode } from "./code";
import { renderCodebaseShelf, renderPreview } from "./widgets";

export function render(state: AppState): string {
  return `
    ${renderHeader(state)}
    ${state.tab === "tickets" ? renderTickets(state) : renderReview(state)}
    ${renderFooter()}
  `;
}

function renderHeader(state: AppState): string {
  return `
    <header class="top">
      <div class="brand">
        <svg class="mark" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="16" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
          <path d="M14 15.5h12M16 19h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M26 12c6 2 9 9 7 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
        <div>
          <p class="eyebrow">Lumin Sign · feature-ticket replay</p>
          <h1>Ponytail</h1>
        </div>
      </div>
      <p class="lede">The lazy senior climbs the ladder before writing code. Caveman cuts what the agent <em>says</em>. Ponytail cuts what it <em>builds</em>.</p>
      <nav class="tabs" aria-label="Demo views">
        <button type="button" data-tab="tickets" aria-selected="${state.tab === "tickets"}">Tickets</button>
        <button type="button" data-tab="review" aria-selected="${state.tab === "review"}">Review</button>
      </nav>
    </header>
  `;
}

function renderTickets(state: AppState): string {
  const ticket = TICKETS.find((item) => item.id === state.ticketId) ?? TICKETS[0];
  const normalLoc = loc(ticket.normal.files);
  const ponyLoc = loc(ticket.ponytail.files);
  const saved = Math.max(0, normalLoc - ponyLoc);
  const pct = normalLoc ? Math.round((saved / normalLoc) * 100) : 0;

  return `
    <main class="layout">
      <aside>
        <h2>Tickets</h2>
        <ol class="ticket-list">
          ${TICKETS.map(
            (item) => `
              <li>
                <button type="button" data-ticket="${item.id}" aria-current="${item.id === ticket.id}">
                  <span class="num">${String(item.number).padStart(2, "0")}</span>
                  <span>
                    <strong>${escapeHtml(item.title)}</strong>
                    <em>stop · ${escapeHtml(item.ponytail.stopLabel)}</em>
                  </span>
                </button>
              </li>
            `,
          ).join("")}
        </ol>
        ${renderCodebaseShelf(ticket.alreadyInRepo)}
        ${renderSuite()}
      </aside>
      <section class="stage">
        <p class="ticket-kicker">Ticket ${String(ticket.number).padStart(2, "0")}</p>
        <h2>${escapeHtml(ticket.title)}</h2>
        <blockquote>${escapeHtml(ticket.request)}</blockquote>
        ${renderLadder(ticket.ponytail.stopRung)}
        <div class="metrics">
          <article class="metric normal">
            <h3>Normal agent</h3>
            <p><strong>${normalLoc}</strong> lines</p>
            <p>${ticket.normal.deps.length} new deps${ticket.normal.deps.length ? ` · ${ticket.normal.deps.map(escapeHtml).join(", ")}` : ""}</p>
          </article>
          <article class="metric pony">
            <h3>Ponytail</h3>
            <p><strong>${ponyLoc}</strong> lines</p>
            <p>${ticket.ponytail.deps.length} new deps</p>
          </article>
          <article class="metric saved">
            <h3>This ticket</h3>
            <p><strong>−${saved}</strong> lines · −${pct}%</p>
            <p>Fixture replay, not the published suite.</p>
          </article>
        </div>
        ${ticket.neverCut.length
          ? `<p class="never-cut">Never cut: ${ticket.neverCut.map(escapeHtml).join(" · ")}</p>`
          : ""}
        <div class="split">
          <article class="pane normal">
            <header>
              <h3>Normal agent</h3>
              <p>${escapeHtml(ticket.normal.note)}</p>
            </header>
            ${renderPreview(ticket.id, "normal", state.widgets)}
            ${ticket.normal.files.map((file) => renderCode(file.path, file.code)).join("")}
          </article>
          <article class="pane pony">
            <header>
              <h3>Ponytail</h3>
              <p>${escapeHtml(ticket.ponytail.note)}</p>
              <p class="skipped">skipped: ${escapeHtml(ticket.ponytail.skipped)}. add when ${escapeHtml(ticket.ponytail.addWhen)}.</p>
            </header>
            ${renderPreview(ticket.id, "pony", state.widgets)}
            ${ticket.ponytail.files.map((file) => renderCode(file.path, file.code)).join("")}
          </article>
        </div>
      </section>
    </main>
  `;
}

function renderLadder(stop: number): string {
  return `
    <ol class="ladder" aria-label="YAGNI ladder">
      ${RUNGS.map((rung) => {
        const cls = rung.id < stop ? "passed" : rung.id === stop ? "stop" : "later";
        return `<li class="${cls}">
          <span class="rung-id">${rung.id}</span>
          <span class="rung-short">${escapeHtml(rung.short)}</span>
          <span class="rung-label">${escapeHtml(rung.label)}</span>
        </li>`;
      }).join("")}
    </ol>
  `;
}

function renderSuite(): string {
  return `
    <section class="suite">
      <h2>Published suite</h2>
      <p>Authors’ 12 feature tasks on a FastAPI + React repo (Haiku 4.5, n=4). Not a guarantee.</p>
      <table>
        <thead>
          <tr><th></th><th>LOC</th><th>Cost</th><th>Time</th><th>Safe</th></tr>
        </thead>
        <tbody>
          <tr>
            <th>Ponytail</th>
            <td>−54%</td><td>−20%</td><td>−27%</td><td>100%</td>
          </tr>
          <tr>
            <th>Caveman</th>
            <td>−20%</td><td>+3%</td><td>+2%</td><td>100%</td>
          </tr>
        </tbody>
      </table>
    </section>
  `;
}

function renderReview(state: AppState): string {
  const review = state.review ?? FIXTURE_REVIEW;
  const source =
    review.source === "live" && review.provider
      ? `live · ${review.provider}`
      : "offline fixture";
  const status = state.llm.live
    ? `Live key detected (${state.llm.provider}). Run can call the model; fixtures still win if the call fails.`
    : "No LLM key. Review is the offline fixture.";

  return `
    <main class="review">
      <section class="review-copy">
        <p class="ticket-kicker">/ponytail-review</p>
        <h2>${escapeHtml(OVERBUILT_TITLE)}</h2>
        <p>${escapeHtml(OVERBUILT_BLURB)}</p>
        <p class="llm-status">${escapeHtml(status)}</p>
        <div class="review-actions">
          <button type="button" class="btn solid" data-run-review ${state.reviewBusy ? "disabled" : ""}>
            ${state.reviewBusy ? "Reviewing…" : "Run Ponytail review"}
          </button>
          <span class="source-pill">${escapeHtml(source)}</span>
        </div>
        ${state.reviewError ? `<p class="error">${escapeHtml(state.reviewError)}</p>` : ""}
      </section>
      <div class="review-grid">
        <section>
          <h3>Over-built change</h3>
          ${OVERBUILT_FILES.map((file) => renderCode(file.path, file.code)).join("")}
        </section>
        <section class="findings">
          <h3>What to delete</h3>
          ${
            review.leanAlready
              ? `<p class="lean">Lean already. Ship.</p>`
              : `<ol>${review.findings
                  .map(
                    (finding) => `
                      <li>
                        <code>${escapeHtml(finding.location)}</code>
                        <span class="tag ${finding.tag}">${finding.tag}</span>
                        <p>${escapeHtml(finding.text)}</p>
                      </li>
                    `,
                  )
                  .join("")}</ol>
                <p class="net">net: ${review.netLines} lines possible.</p>`
          }
        </section>
      </div>
    </main>
  `;
}

function renderFooter(): string {
  return `
    <footer class="foot">
      <p>Real skill: <a href="https://github.com/DietrichGebert/ponytail" target="_blank" rel="noreferrer">DietrichGebert/ponytail</a> (MIT). Pair with Caveman for terse prose — different halves, no overlap.</p>
    </footer>
  `;
}
