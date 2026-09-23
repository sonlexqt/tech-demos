import {
  JSONUIProvider,
  Renderer,
  type Spec,
} from "@json-render/react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { getActionLog, subscribeActionLog } from "./action-log";
import { CATALOG_ACTION_NAMES, CATALOG_COMPONENT_NAMES, catalog } from "./catalog";
import { PRESET_PROMPTS, SIGNATURE_REQUESTS } from "./data/requests";
import { generateSpecFromPrompt } from "./generate/buildSpec";
import { fetchComposeStatus, streamJevCompose, type ComposeStatus } from "./generate/jevStream";
import { streamSpecProgressively } from "./generate/streamSpec";
import { recordRemind } from "./action-log";
import { registry } from "./registry";
import type { ActionLogEntry } from "./types";

function collectTypes(spec: Spec | null): string[] {
  if (!spec) return [];
  return [...new Set(Object.values(spec.elements).map((element) => element.type))].sort();
}

export function App() {
  const [prompt, setPrompt] = useState<string>(PRESET_PROMPTS[0].prompt);
  const [spec, setSpec] = useState<Spec | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patchInfo, setPatchInfo] = useState<{ applied: number; total: number; last: string } | null>(
    null,
  );
  const [engine, setEngine] = useState<ComposeStatus>({
    available: false,
    engine: "fixture",
    model: null,
  });
  const [specOpen, setSpecOpen] = useState(false);
  const [log, setLog] = useState<ActionLogEntry[]>(getActionLog);
  const [toast, setToast] = useState<ActionLogEntry | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => subscribeActionLog(setLog), []);

  useEffect(() => {
    void fetchComposeStatus().then(setEngine);
  }, []);

  useEffect(() => {
    if (log[0]) {
      setToast(log[0]);
      const timer = window.setTimeout(() => setToast(null), 3200);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [log]);

  const usedTypes = useMemo(() => collectTypes(spec), [spec]);
  const validation = spec ? catalog.validate(spec) : null;
  const actionHandlers = useMemo(
    () => ({
      remind_signer: (params: Record<string, unknown>) => {
        const requestId = typeof params.requestId === "string" ? params.requestId : "unknown";
        const label = typeof params.label === "string" ? params.label : null;
        recordRemind(requestId, label);
      },
    }),
    [],
  );

  async function generate(nextPrompt = prompt) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setIsStreaming(true);
    setSpec(null);
    setPatchInfo(null);

    try {
      const live = await fetchComposeStatus();
      setEngine(live);
      if (live.available) {
        await streamJevCompose(
          nextPrompt,
          (progress) => {
            setSpec(progress.spec);
            setPatchInfo({
              applied: progress.step,
              total: progress.step,
              last: progress.stopReason
                ? `Jev ${progress.stopReason}`
                : `Jev composition snapshot ${progress.step}`,
            });
          },
          controller.signal,
        );
        return;
      }

      const generated = generateSpecFromPrompt(nextPrompt);
      await streamSpecProgressively(
        generated.spec,
        (progress) => {
          setSpec(progress.spec);
          setPatchInfo({
            applied: progress.applied,
            total: progress.total,
            last: progress.lastPatch,
          });
        },
        controller.signal,
      );
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError(caught instanceof Error ? caught.message : "Generate failed");
    } finally {
      setIsStreaming(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void generate();
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Lumin-style ops · json-render catalog</p>
          <h1>Signature request board</h1>
          <p className="lede">
            Prompts become a guardrailed Spec — not HTML. Custom e-sign components plus a few
            shadcn layout primitives. Offline SpecStream fixtures, or live TypeSafe Jev
            composition when a server key is set.
          </p>
          <span
            className={`engine-badge ${engine.engine === "jev" ? "is-jev" : "is-fixture"}`}
            title={
              engine.engine === "jev"
                ? `experimental_composeSpec via ${engine.model}`
                : "No server JEV_API_KEY — using catalog-constrained fixtures"
            }
          >
            {engine.engine === "jev" ? "Live Jev" : "Fixture SpecStream"}
          </span>
        </div>
        <div className="catalog-pills" aria-label="Allowed catalog types">
          {CATALOG_COMPONENT_NAMES.map((name) => (
            <span
              key={name}
              className={`catalog-pill ${usedTypes.includes(name) ? "is-used" : ""}`}
            >
              {name}
            </span>
          ))}
          {CATALOG_ACTION_NAMES.map((name) => (
            <span key={name} className="catalog-pill is-action">
              {name}
            </span>
          ))}
        </div>
      </header>

      <div className="workspace">
        <aside className="ledger">
          <h2>Seed ledger</h2>
          <p>Ten fake packets the generator can reference. Hardcoded, no API.</p>
          <ol>
            {SIGNATURE_REQUESTS.map((request) => (
              <li key={request.id}>
                <strong>{request.id}</strong>
                <span>{request.title}</span>
                <em>
                  {request.status} · {request.region}
                </em>
              </li>
            ))}
          </ol>
        </aside>

        <main className="stage">
          <form className="prompt-box" onSubmit={onSubmit}>
            <label htmlFor="prompt">Natural-language board prompt</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={3}
              placeholder="Show overdue external-counsel requests needing a remind"
            />
            <div className="preset-row">
              {PRESET_PROMPTS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={preset.prompt === prompt ? "preset is-active" : "preset"}
                  onClick={() => {
                    setPrompt(preset.prompt);
                    void generate(preset.prompt);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="prompt-actions">
              <button type="submit" className="primary" disabled={isStreaming || !prompt.trim()}>
                {isStreaming
                  ? engine.engine === "jev"
                    ? "Composing with Jev…"
                    : "Streaming Spec…"
                  : "Generate / stream"}
              </button>
              <span
                className={`engine-badge ${engine.engine === "jev" ? "is-jev" : "is-fixture"}`}
                title={
                  engine.engine === "jev"
                    ? `experimental_composeSpec via ${engine.model}`
                    : "No server JEV_API_KEY — using catalog-constrained fixtures"
                }
              >
                {engine.engine === "jev" ? "Live Jev" : "Fixture SpecStream"}
              </span>
            </div>
          </form>

          {error ? <p className="error-banner">{error}</p> : null}

          <section className="board-panel" aria-live="polite">
            <div className="board-panel-head">
              <h2>Live board</h2>
              {patchInfo ? (
                <span className="stream-meter">
                  {engine.engine === "jev"
                    ? `Jev snapshot ${patchInfo.applied}${isStreaming ? " · composing" : " · settled"}`
                    : `SpecStream ${patchInfo.applied}/${patchInfo.total} patches${
                        isStreaming ? " · applying" : " · settled"
                      }`}
                </span>
              ) : (
                <span className="stream-meter">Waiting for a prompt</span>
              )}
            </div>

            <JSONUIProvider registry={registry} handlers={actionHandlers} initialState={{}}>
              <div className="board-canvas">
                {spec ? (
                  <Renderer spec={spec} registry={registry} loading={isStreaming} />
                ) : (
                  <p className="empty-board">
                    Stream a prompt. The renderer only accepts catalog types listed above — raw
                    HTML is rejected.
                  </p>
                )}
              </div>
            </JSONUIProvider>
          </section>

          <details className="spec-peek" open={specOpen} onToggle={(event) => setSpecOpen(event.currentTarget.open)}>
            <summary>Spec JSON peek {usedTypes.length ? `(${usedTypes.join(", ")})` : ""}</summary>
            <pre>{spec ? JSON.stringify(spec, null, 2) : "// generate to see the catalog-constrained spec"}</pre>
            {validation ? (
              <p className={validation.success ? "valid-ok" : "valid-bad"}>
                {validation.success
                  ? "catalog.validate: success — only registered component types."
                  : `catalog.validate: failed — ${validation.error?.message ?? "see console"}`}
              </p>
            ) : null}
            {patchInfo ? (
              <p className="last-patch">
                Last patch: <code>{patchInfo.last}</code>
              </p>
            ) : null}
          </details>
        </main>

        <aside className="log-rail">
          <h2>Action log</h2>
          <p>
            <code>remind_signer</code> is a catalog action. It only writes this rail — no mail
            leaves the browser.
          </p>
          {log.length === 0 ? (
            <p className="empty-log">Click Remind on a generated card.</p>
          ) : (
            <ul>
              {log.map((entry) => (
                <li key={entry.id}>
                  <time>{entry.at}</time>
                  <strong>{entry.requestId}</strong>
                  <span>{entry.note}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {toast ? (
        <div className="toast" role="status">
          Remind queued for <strong>{toast.requestId}</strong> — no email sent.
        </div>
      ) : null}

    </div>
  );
}
