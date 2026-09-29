import { PLANS } from "../core/plans";
import type { JevMode, StepLog, TargetId, TestPlan } from "../core/types";
import { ModeBadge } from "./ModeBadge";

type Props = {
  mode: JevMode;
  plan: TestPlan;
  stepIndex: number;
  running: boolean;
  highlight: TargetId | null;
  logs: StepLog[];
  busy: boolean;
  lastError: string | null;
  onPlanChange: (planId: string) => void;
  onRun: () => void;
  onStep: () => void;
  onReset: () => void;
};

function formatProbabilities(values?: Record<string, number>) {
  if (!values) return null;
  const entries = Object.entries(values)
    .filter(([key]) => Number.isNaN(Number(key)))
    .slice(0, 4);
  if (entries.length === 0) return null;
  return entries
    .map(([key, value]) => `${key} ${(value * 100).toFixed(0)}%`)
    .join(" · ");
}

export function TestRunner({
  mode,
  plan,
  stepIndex,
  running,
  highlight,
  logs,
  busy,
  lastError,
  onPlanChange,
  onRun,
  onStep,
  onReset,
}: Props) {
  const current = plan.steps[stepIndex];
  const latest = logs[logs.length - 1];
  const done = stepIndex >= plan.steps.length;

  return (
    <aside className="runner" aria-label="Test plan runner">
      <header className="runner-head">
        <div>
          <p className="brand-kicker">Jev test plan</p>
          <h2>Runner</h2>
        </div>
        <ModeBadge mode={mode} />
      </header>

      <label className="plan-select">
        <span>Preset plan</span>
        <select
          value={plan.id}
          onChange={(event) => onPlanChange(event.target.value)}
          disabled={busy}
        >
          {PLANS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
        <p className="plan-summary">{plan.summary}</p>
      </label>

      <div className="controls" role="group" aria-label="Runner controls">
        <button type="button" className="primary" onClick={onRun} disabled={busy || done}>
          Run
        </button>
        <button type="button" className="ghost" onClick={onStep} disabled={busy || done}>
          Step
        </button>
        <button type="button" className="ghost" onClick={onReset} disabled={busy && running}>
          Reset
        </button>
      </div>
      <p className="keys">
        <kbd>R</kbd> run · <kbd>Enter</kbd> / <kbd>Space</kbd> step ·{" "}
        <kbd>Esc</kbd> reset
      </p>

      <ol className="step-list">
        {plan.steps.map((step, index) => {
          const log = logs.find((item) => item.stepId === step.id);
          const active = index === stepIndex && !done;
          return (
            <li
              key={step.id}
              className={[
                "step-item",
                active ? "is-active" : "",
                log?.passed ? "is-pass" : "",
                log && !log.passed ? "is-fail" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="step-index">{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <em>
                  {step.primitive} · {step.actionSpace.length} options
                </em>
              </div>
            </li>
          );
        })}
      </ol>

      <section className="decision" aria-live="polite">
        <p className="card-kicker">Current decision</p>
        {lastError ? <p className="decision-error">{lastError}</p> : null}
        {done && !latest ? (
          <p>Plan reset. Press Step or Run.</p>
        ) : current && !latest && !done ? (
          <p>
            Next: <strong>{current.title}</strong> via {current.primitive}.
            Action space:{" "}
            {current.actionSpace.map((action) => action.id).join(", ")}.
          </p>
        ) : latest ? (
          <>
            <p>
              <strong>{latest.decision.primitive}</strong> → {latest.chosenLabel}
            </p>
            <p>
              confidence {(latest.decision.confidence * 100).toFixed(0)}%
              {latest.decision.score !== undefined
                ? ` · score ${latest.decision.score.toFixed(2)}`
                : ""}
            </p>
            <p className="muted">{formatProbabilities(latest.decision.probabilities)}</p>
            {highlight ? (
              <p className="highlight-note">Highlighting #{highlight}</p>
            ) : null}
          </>
        ) : null}
      </section>

      <section className="log" aria-label="Pass fail log">
        <p className="card-kicker">Pass / fail log</p>
        {logs.length === 0 ? (
          <p className="muted">No steps yet.</p>
        ) : (
          <ul>
            {logs.map((log) => (
              <li key={log.stepId} className={log.passed ? "is-pass" : "is-fail"}>
                <span>{log.passed ? "PASS" : "FAIL"}</span>
                <div>
                  <strong>{log.stepTitle}</strong>
                  <p>{log.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
