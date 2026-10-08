import { buildSlices, incrementCycle } from "../data/build";
import { compareFair, compareIntro, compareRows, superpowersPr } from "../data/compare";
import { planCheckpoints, planRisks, planTasks } from "../data/plan";
import { rationalizations } from "../data/rationalizations";
import { personas, reviewComments, reviewSummary } from "../data/review";
import { rollbackPlan, shipChecklist } from "../data/ship";
import { specAssumptions, specMarkdown } from "../data/spec";
import { stages } from "../data/stages";
import { pack, ticket } from "../data/ticket";
import { beyonce, verifyLog, verifyPyramid } from "../data/verify";
import { formatBody, splitSections } from "../lib/markdown";
import { esc } from "../lib/dom";
import type { AppState } from "../state";
import type { StageId } from "../types";

const stageOrder: StageId[] = stages.map((s) => s.id);

export function render(state: AppState): string {
  return `
    ${renderHeader(state)}
    ${state.tab === "lifecycle" ? renderLifecycle(state) : renderCompare()}
  `;
}

function renderHeader(state: AppState): string {
  return `
    <header class="top">
      <div class="brand">
        <span class="mark" aria-hidden="true"></span>
        <div>
          <p class="eyebrow">Lumin Sign · ${esc(ticket.id)}</p>
          <h1>${esc(ticket.title)}</h1>
          <p class="tag">${esc(ticket.workspace)} · ${esc(pack.name)} · ${esc(ticket.fixture)}</p>
        </div>
      </div>
      <div class="top-actions">
        <div class="tabs" role="tablist">
          <button type="button" class="tab ${state.tab === "lifecycle" ? "is-on" : ""}" data-tab="lifecycle" role="tab" aria-selected="${state.tab === "lifecycle"}">Lifecycle</button>
          <button type="button" class="tab ${state.tab === "compare" ? "is-on" : ""}" data-tab="compare" role="tab" aria-selected="${state.tab === "compare"}">Compare</button>
        </div>
        <a class="ghost" href="${esc(pack.url)}" target="_blank" rel="noreferrer">Upstream pack</a>
      </div>
    </header>
  `;
}

function renderLifecycle(state: AppState): string {
  const stage = stages.find((s) => s.id === state.stage) ?? stages[0];
  const idx = stageOrder.indexOf(state.stage);
  const prev = idx > 0 ? stageOrder[idx - 1] : null;
  const next = idx < stageOrder.length - 1 ? stageOrder[idx + 1] : null;

  return `
    <section class="timeline" aria-label="Lifecycle stages">
      ${stages
        .map((s) => {
          const on = s.id === state.stage;
          const seen = state.seenStages.includes(s.id);
          return `
            <button type="button" class="step ${on ? "is-on" : ""} ${seen && !on ? "is-seen" : ""}" data-stage="${s.id}">
              <span class="step-idx">${s.index}</span>
              <span class="step-meta">
                <span class="step-phase">${esc(s.phase)}</span>
                <span class="step-cmd">${esc(s.command)}</span>
              </span>
            </button>
          `;
        })
        .join("")}
    </section>

    <div class="layout">
      <article class="panel artifact">
        <div class="panel-head">
          <div>
            <p class="eyebrow">${esc(stage.command)} · ${esc(stage.skill)}</p>
            <h2>${esc(stage.artifact)}</h2>
            <p class="muted">${esc(stage.blurb)}</p>
          </div>
          <div class="stage-nav">
            <button type="button" class="ghost" data-stage="${prev ?? ""}" ${prev ? "" : "disabled"}>Previous</button>
            <button type="button" class="primary" data-stage="${next ?? ""}" ${next ? "" : "disabled"}>${next ? "Next stage" : "Done"}</button>
          </div>
        </div>
        ${renderStage(state)}
      </article>
      ${renderCatcher(state)}
    </div>
  `;
}

function renderStage(state: AppState): string {
  switch (state.stage) {
    case "define":
      return renderDefine();
    case "plan":
      return renderPlan();
    case "build":
      return renderBuild();
    case "verify":
      return renderVerify();
    case "review":
      return renderReview(state);
    case "ship":
      return renderShip();
  }
}

function renderDefine(): string {
  const specBody = specMarkdown.replace(/^# .+\n+/, "");
  const sections = splitSections(specBody);
  return `
    <div class="chips">
      ${specAssumptions.map((a) => `<span class="chip">${esc(a)}</span>`).join("")}
    </div>
    <div class="spec-grid">
      ${sections
        .map(
          (section) => `
            <section class="card spec-card">
              <h3>${esc(section.title)}</h3>
              ${formatBody(section.body)}
            </section>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderPlan(): string {
  return `
    <div class="task-list">
      ${planTasks
        .map(
          (task) => `
            <article class="card task">
              <header>
                <span class="pill">${esc(task.id)}</span>
                <h3>${esc(task.title)}</h3>
                <span class="size">${esc(task.size)} · ${task.files} files · deps ${esc(task.deps)}</span>
              </header>
              <p class="label">Acceptance</p>
              <ul>${task.acceptance.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
              <p class="verify"><code>${esc(task.verify)}</code></p>
            </article>
          `,
        )
        .join("")}
    </div>
    <div class="split">
      <section class="card">
        <h3>Checkpoints</h3>
        ${planCheckpoints
          .map(
            (c) => `
              <p class="label">After ${esc(c.after)}</p>
              <ul>${c.checks.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
            `,
          )
          .join("")}
      </section>
      <section class="card">
        <h3>Risks</h3>
        <table>
          <thead><tr><th>Risk</th><th>Impact</th><th>Mitigation</th></tr></thead>
          <tbody>
            ${planRisks
              .map(
                (r) =>
                  `<tr><td>${esc(r.risk)}</td><td>${esc(r.impact)}</td><td>${esc(r.mitigation)}</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </section>
    </div>
  `;
}

function renderBuild(): string {
  return `
    <ol class="cycle">
      ${incrementCycle.map((step) => `<li>${esc(step)}</li>`).join("")}
    </ol>
    <div class="slices">
      ${buildSlices
        .map(
          (slice) => `
            <article class="card slice">
              <div class="slice-top">
                <span class="pill">${esc(slice.id)} · ${esc(slice.task)}</span>
                <span class="ok">${esc(slice.status)}</span>
              </div>
              <h3>${esc(slice.title)}</h3>
              <p class="commit"><code>${esc(slice.commit)}</code></p>
              <p class="muted">${slice.lines} lines · ${esc(slice.note)}</p>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderVerify(): string {
  return `
    <div class="pyramid">
      <span><strong>Unit</strong> ${esc(verifyPyramid.unit)}</span>
      <span><strong>Integration</strong> ${esc(verifyPyramid.integration)}</span>
      <span><strong>E2E</strong> ${esc(verifyPyramid.e2e)}</span>
    </div>
    <ol class="tdd-log">
      ${verifyLog
        .map(
          (row) => `
            <li class="card tdd ${row.result === "FAIL" ? "is-red" : "is-green"}">
              <div class="tdd-top">
                <span class="phase">${esc(row.phase)}</span>
                <span class="result">${esc(row.result)}</span>
              </div>
              <code>${esc(row.command)}</code>
              <p>${esc(row.detail)}</p>
            </li>
          `,
        )
        .join("")}
    </ol>
    <p class="quote">${esc(beyonce)}</p>
  `;
}

function renderReview(state: AppState): string {
  const comments = reviewComments.filter(
    (c) => state.persona === "all" || c.persona === state.persona,
  );
  return `
    <div class="verdict card">
      <p class="eyebrow">Verdict</p>
      <h3>${esc(reviewSummary.verdict)}</h3>
      <p>${esc(reviewSummary.overview)}</p>
      <div class="axes">
        ${reviewSummary.axes
          .map(
            (a) => `
              <div>
                <strong>${esc(a.name)}</strong>
                <span class="pill">${esc(a.score)}</span>
                <p class="muted">${esc(a.note)}</p>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
    <div class="persona-bar" role="tablist" aria-label="Reviewer personas">
      ${personas
        .map(
          (p) => `
            <button type="button" class="tab ${state.persona === p.id ? "is-on" : ""}" data-persona="${p.id}" title="${esc(p.hint)}">${esc(p.label)}</button>
          `,
        )
        .join("")}
    </div>
    <p class="muted persona-hint">${esc(personas.find((p) => p.id === state.persona)?.hint ?? "")}</p>
    <div class="comments">
      ${comments
        .map(
          (c) => `
            <article class="card comment sev-${esc(c.severity.toLowerCase())}">
              <header>
                <span class="sev">${esc(c.severity)}</span>
                <span class="pill">${esc(c.axis)}</span>
                <span class="who">${esc(c.personaLabel)}</span>
                <code>${esc(c.location)}</code>
              </header>
              <p>${esc(c.body)}</p>
              ${c.fix ? `<p class="fix"><strong>Fix:</strong> ${esc(c.fix)}</p>` : ""}
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderShip(): string {
  return `
    <div class="split">
      <div>
        ${shipChecklist
          .map(
            (block) => `
              <section class="card">
                <h3>${esc(block.section)}</h3>
                <ul class="checks">
                  ${block.items
                    .map(
                      (item) =>
                        `<li class="${item.done ? "is-done" : "is-open"}">${esc(item.label)}</li>`,
                    )
                    .join("")}
                </ul>
              </section>
            `,
          )
          .join("")}
      </div>
      <section class="card rollback">
        <h3>${esc(rollbackPlan.title)}</h3>
        <p class="label">Trigger conditions</p>
        <ul>${rollbackPlan.triggers.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        <p class="label">Rollback steps</p>
        <ol>${rollbackPlan.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
        <p class="label">Time to rollback</p>
        <ul>${rollbackPlan.times.map((t) => `<li><strong>${esc(t.path)}</strong> — ${esc(t.time)}</li>`).join("")}</ul>
        <ol class="cycle flag">
          ${rollbackPlan.flagLifecycle.map((s) => `<li>${esc(s)}</li>`).join("")}
        </ol>
      </section>
    </div>
  `;
}

function renderCatcher(state: AppState): string {
  const relevant = rationalizations.filter((r) => r.stage === state.stage || r.stage === "any");
  const selected = rationalizations.find((r) => r.id === state.catcherId) ?? null;
  return `
    <aside class="panel catcher" aria-label="Rationalization catcher">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Anti-rationalization gate</p>
          <h2>Rationalization catcher</h2>
          <p class="muted">The agent tries a shortcut. The skill blocks it and asks for evidence.</p>
        </div>
      </div>
      <div class="excuses">
        ${relevant
          .map((r) => {
            const on = r.id === state.catcherId;
            const blocked = state.blocked.includes(r.id);
            return `
              <button type="button" class="excuse ${on ? "is-on" : ""} ${blocked ? "is-blocked" : ""}" data-excuse="${r.id}">
                <span class="excuse-kicker">${blocked ? "Blocked" : "Agent says"}</span>
                <span>${esc(r.excuse)}</span>
              </button>
            `;
          })
          .join("")}
      </div>
      ${
        selected
          ? `
            <div class="block-card">
              <p class="block-banner">Blocked by ${esc(selected.skill)}</p>
              <p class="label">Rebuttal</p>
              <p>${esc(selected.rebuttal)}</p>
              <p class="label">Required evidence</p>
              <ul>${selected.evidence.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>
            </div>
          `
          : `<p class="muted empty-catch">Pick a shortcut. None of them get through.</p>`
      }
    </aside>
  `;
}

function renderCompare(): string {
  return `
    <section class="compare">
      <div class="compare-lede card">
        <p class="eyebrow">Optional · fixtures only</p>
        <h2>${esc(compareIntro.title)}</h2>
        <p>${esc(compareIntro.lede)}</p>
      </div>
      <div class="split">
        <article class="card">
          <h3>agent-skills on SIGN-1847</h3>
          <p>${esc(compareIntro.agentSkills)}</p>
        </article>
        <article class="card">
          <h3>Superpowers on PR #${superpowersPr.number}</h3>
          <p>${esc(compareIntro.superpowers)}</p>
          <p class="muted">${esc(superpowersPr.method)}</p>
          <p class="muted">${esc(superpowersPr.artifacts)}</p>
          <p><a href="${esc(superpowersPr.url)}" target="_blank" rel="noreferrer">${esc(superpowersPr.title)}</a></p>
        </article>
      </div>
      <table class="compare-table">
        <thead>
          <tr>
            <th>Axis</th>
            <th>agent-skills</th>
            <th>Superpowers twin</th>
          </tr>
        </thead>
        <tbody>
          ${compareRows
            .map(
              (row) => `
                <tr>
                  <th>${esc(row.axis)}</th>
                  <td>${esc(row.agentSkills)}</td>
                  <td>${esc(row.superpowers)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
      <p class="quote">${esc(compareFair)}</p>
    </section>
  `;
}
