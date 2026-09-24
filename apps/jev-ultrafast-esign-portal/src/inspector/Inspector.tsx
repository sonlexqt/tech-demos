import type { Decision, HistoryItem, JevElement, ModeInfo } from "../types";
import { OPERATIONS } from "../types";
import { formatElementRow } from "../portal/elements";

type Props = {
  goal: string;
  onGoal: (goal: string) => void;
  elements: JevElement[];
  decision: Decision | null;
  history: HistoryItem[];
  busy: boolean;
  running: boolean;
  onStep: () => void;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
};

function pct(n: number | undefined) {
  return `${Math.round((n ?? 0) * 100)}%`;
}

export function Inspector({
  goal,
  onGoal,
  elements,
  decision,
  history,
  busy,
  running,
  onStep,
  onRun,
  onStop,
  onReset,
}: Props) {
  const chosenIndex = decision?.target?.split(":")[0] ?? null;

  return (
    <aside className="inspector">
      <h2>Jev inspector</h2>
      <p className="hint">
        One round trip: operation + numbered target. This is a playground of that loop — not the
        Chrome Browser Use harness.
      </p>

      <label htmlFor="goal">Goal</label>
      <textarea id="goal" value={goal} onChange={(e) => onGoal(e.target.value)} />

      <div className="inspector-actions">
        <button type="button" className="primary" disabled={busy || running} onClick={onStep}>
          Step once
        </button>
        {running ? (
          <button type="button" onClick={onStop}>
            Stop
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={onRun}>
            Run automatically
          </button>
        )}
        <button type="button" disabled={busy || running} onClick={onReset}>
          Reset
        </button>
      </div>

      <h3>Element table</h3>
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Role</th>
            <th>Label / value</th>
            <th>Ops</th>
          </tr>
        </thead>
        <tbody>
          {elements.map((el) => (
            <tr key={el.id} className={String(el.index) === chosenIndex ? "chosen" : ""}>
              <td>{el.index}</td>
              <td>{el.role}</td>
              <td>
                {el.label}
                {el.role !== "button" ? ` · ${el.value || "empty"}` : ""}
                {el.disabled ? " (disabled)" : ""}
              </td>
              <td>{el.operations.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint" style={{ marginTop: "0.45rem" }}>
        {elements.map(formatElementRow).join("\n")}
      </p>

      <h3>Action probabilities</h3>
      {OPERATIONS.map((op) => (
        <div className="prob" key={op}>
          <span>{op}</span>
          <div className="bar">
            <span style={{ width: pct(decision?.operation_probabilities[op]) }} />
          </div>
          <span>{pct(decision?.operation_probabilities[op])}</span>
        </div>
      ))}

      {decision && Object.keys(decision.target_probabilities).length > 0 && (
        <>
          <h3>Target probabilities</h3>
          {Object.entries(decision.target_probabilities)
            .sort((a, b) => Number(a[0].split(":")[0]) - Number(b[0].split(":")[0]))
            .map(([key, value]) => (
              <div className="prob" key={key}>
                <span>[{key}]</span>
                <div className="bar">
                  <span style={{ width: pct(value) }} />
                </div>
                <span>{pct(value)}</span>
              </div>
            ))}
        </>
      )}

      <h3>Chosen action</h3>
      <div className="chosen-box">
        {decision
          ? `${decision.operation}${decision.target ? ` [${decision.target}]` : ""}${
              decision.text ? ` “${decision.text}”` : ""
            } · ${decision.source} · ${decision.latency_ms}ms · conf ${decision.confidence.toFixed(2)}`
          : "No step yet"}
        {decision?.error ? <div className="error">{decision.error}</div> : null}
      </div>

      <h3>Executed steps</h3>
      <ol className="log">
        {history.length === 0 ? <li>Waiting for the first decision…</li> : null}
        {history.map((item, i) => (
          <li key={`${i}-${item.action}`}>
            {i + 1}. {item.action}
          </li>
        ))}
      </ol>
    </aside>
  );
}

export function ModeBadge({ mode }: { mode: ModeInfo }) {
  const live = mode.mode === "live";
  return (
    <span className={`badge ${live ? "live" : "fixture"}`}>
      <i />
      {live ? `Live Jev${mode.provider ? ` · ${mode.provider}` : ""}` : "Fixture"}
    </span>
  );
}
