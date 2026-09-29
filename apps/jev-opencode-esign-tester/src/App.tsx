import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PLANS, planById } from "./core/plans";
import { runStep } from "./core/runner";
import {
  applyAction,
  createInitialState,
  refreshablePatch,
} from "./core/sign-state";
import type { JevMode, SignState, StepLog, TargetId } from "./core/types";
import { decideForStep, fetchJevMode } from "./jev/browser";
import { SignSurface } from "./ui/SignSurface";
import { TestRunner } from "./ui/TestRunner";

function applyManualPatch(state: SignState, patch: Partial<SignState>): SignState {
  return refreshablePatch({ ...state, ...patch });
}

export function App() {
  const [mode, setMode] = useState<JevMode>("fixture");
  const [planId, setPlanId] = useState(PLANS[0].id);
  const [sign, setSign] = useState<SignState>(createInitialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [highlight, setHighlight] = useState<TargetId | null>(null);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const plan = useMemo(() => planById(planId), [planId]);

  useEffect(() => {
    let alive = true;
    fetchJevMode().then((info) => {
      if (alive) setMode(info.mode);
    });
    return () => {
      alive = false;
    };
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setRunning(false);
    setBusy(false);
    setSign(createInitialState());
    setStepIndex(0);
    setLogs([]);
    setHighlight(null);
    setLastError(null);
  }, []);

  const changePlan = useCallback(
    (nextId: string) => {
      setPlanId(nextId);
      cancelRef.current = true;
      setRunning(false);
      setBusy(false);
      setSign(createInitialState());
      setStepIndex(0);
      setLogs([]);
      setHighlight(null);
      setLastError(null);
    },
    [],
  );

  const advanceOne = useCallback(async () => {
    const step = plan.steps[stepIndex];
    if (!step) return false;
    setBusy(true);
    setLastError(null);
    try {
      const result = await runStep(step, sign, (nextStep, state) =>
        decideForStep(nextStep, state, mode),
      );
      setSign(result.state);
      setLogs((current) => [...current, result.log]);
      setHighlight(result.log.highlight);
      setStepIndex((index) => index + 1);
      return result.log.passed;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Step failed";
      setLastError(message);
      return false;
    } finally {
      setBusy(false);
    }
  }, [mode, plan.steps, sign, stepIndex]);

  const stepOnce = useCallback(async () => {
    if (busy || stepIndex >= plan.steps.length) return;
    cancelRef.current = false;
    await advanceOne();
  }, [advanceOne, busy, plan.steps.length, stepIndex]);

  const runAll = useCallback(async () => {
    if (busy || stepIndex >= plan.steps.length) return;
    cancelRef.current = false;
    setRunning(true);
    let index = stepIndex;
    let state = sign;
    while (index < plan.steps.length && !cancelRef.current) {
      const step = plan.steps[index];
      setBusy(true);
      setLastError(null);
      try {
        const result = await runStep(step, state, (nextStep, current) =>
          decideForStep(nextStep, current, mode),
        );
        state = result.state;
        setSign(result.state);
        setLogs((current) => [...current, result.log]);
        setHighlight(result.log.highlight);
        index += 1;
        setStepIndex(index);
        if (!result.log.passed) break;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Run failed";
        setLastError(message);
        break;
      } finally {
        setBusy(false);
      }
      await new Promise((resolve) => setTimeout(resolve, 450));
    }
    setRunning(false);
  }, [busy, mode, plan.steps, sign, stepIndex]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;
      if (typing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        reset();
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        void runAll();
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        void stepOnce();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reset, runAll, stepOnce]);

  return (
    <div className="app-shell">
      <p className="masthead">
        OpenCode × TypeSafe Jev e-sign tester — this page is a fixture UI + plan
        runner. The real coding-agent harness is{" "}
        <a href="https://jevtypesafeai.com/integrations/opencode">
          Jev in OpenCode
        </a>
        .
      </p>
      <main className="layout">
        <SignSurface
          state={sign}
          highlight={highlight}
          onChange={(patch) => setSign((current) => applyManualPatch(current, patch))}
          onSend={() =>
            setSign((current) =>
              applyAction(current, {
                id: "manual-send",
                kind: "click",
                target: "send",
                label: "Send",
              }),
            )
          }
          onDecline={() =>
            setSign((current) =>
              applyAction(current, {
                id: "manual-decline",
                kind: "click",
                target: "decline",
                label: "Decline",
              }),
            )
          }
        />
        <TestRunner
          mode={mode}
          plan={plan}
          stepIndex={stepIndex}
          running={running}
          highlight={highlight}
          logs={logs}
          busy={busy}
          lastError={lastError}
          onPlanChange={changePlan}
          onRun={() => void runAll()}
          onStep={() => void stepOnce()}
          onReset={reset}
        />
      </main>
    </div>
  );
}
