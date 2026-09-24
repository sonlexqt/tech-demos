import { useCallback, useEffect, useRef, useState } from "react";
import { Inspector, ModeBadge } from "./inspector/Inspector";
import { listElements } from "./portal/elements";
import { applyDecision } from "./portal/execute";
import { EsignPortal } from "./portal/EsignPortal";
import { initialPortal, pageSnapshot } from "./portal/state";
import type { Decision, HistoryItem, ModeInfo, PortalState } from "./types";
import { DEFAULT_GOAL } from "./types";

const MAX_STEPS = 24;

export function App() {
  const [portal, setPortal] = useState<PortalState>(initialPortal);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [mode, setMode] = useState<ModeInfo>({ mode: "fixture", provider: null });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const stopRef = useRef(false);
  const portalRef = useRef(portal);
  const historyRef = useRef(history);
  portalRef.current = portal;
  historyRef.current = history;

  useEffect(() => {
    fetch("/api/mode")
      .then((r) => r.json())
      .then((info: ModeInfo) => setMode(info))
      .catch(() => setMode({ mode: "fixture", provider: null }));
  }, []);

  const stepOnce = useCallback(async () => {
    const current = portalRef.current;
    const elements = listElements(current);
    setBusy(true);
    try {
      const response = await fetch("/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          page: pageSnapshot(current),
          elements,
          history: historyRef.current,
          portal: current,
        }),
      });
      const nextDecision = (await response.json()) as Decision;
      setDecision(nextDecision);
      if (nextDecision.error) {
        setHistory((h) => [
          ...h,
          {
            action: `ERROR ${nextDecision.error}`,
            kind: nextDecision.operation,
            target: nextDecision.target,
          },
        ]);
        return nextDecision;
      }
      const applied = applyDecision(current, nextDecision, elements);
      setPortal(applied.state);
      setHistory((h) => [
        ...h,
        {
          action: applied.action,
          kind: nextDecision.operation,
          text: nextDecision.text,
          target: nextDecision.target,
          page_changed: applied.page_changed,
        },
      ]);
      return nextDecision;
    } finally {
      setBusy(false);
    }
  }, [goal]);

  const runAuto = useCallback(async () => {
    stopRef.current = false;
    setRunning(true);
    try {
      for (let i = 0; i < MAX_STEPS; i++) {
        if (stopRef.current) break;
        const next = await stepOnce();
        if (!next || next.operation === "DONE" || next.error) break;
        await new Promise((resolve) => setTimeout(resolve, 520));
      }
    } finally {
      setRunning(false);
    }
  }, [stepOnce]);

  const reset = () => {
    stopRef.current = true;
    setRunning(false);
    setPortal(initialPortal());
    setHistory([]);
    setDecision(null);
  };

  const highlight = decision?.target ? Number(decision.target.split(":")[0]) : null;
  const elements = listElements(portal);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="mark">L</div>
          <div>
            <h1>Lumen Sign</h1>
            <p>Mock requester portal · TypeSafe Jev decision loop</p>
          </div>
        </div>
        <ModeBadge mode={mode} />
      </header>
      <div className="workspace">
        <EsignPortal
          state={portal}
          highlightIndex={Number.isFinite(highlight) ? highlight : null}
          locked={running}
          onChange={setPortal}
        />
        <Inspector
          goal={goal}
          onGoal={setGoal}
          elements={elements}
          decision={decision}
          history={history}
          busy={busy}
          running={running}
          onStep={() => void stepOnce()}
          onRun={() => void runAuto()}
          onStop={() => {
            stopRef.current = true;
          }}
          onReset={reset}
        />
      </div>
    </div>
  );
}
