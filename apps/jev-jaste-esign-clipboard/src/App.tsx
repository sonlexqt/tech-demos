import { useEffect, useMemo, useState } from "react";
import { PRESETS } from "./presets";
import type { ClassifyResponse, ModeInfo, Proposal, Workspace } from "./types";
import { TARGET_LABELS, applyProposal, applyProposals, emptyWorkspace } from "./workspace";

const INTENT_LABEL: Record<ClassifyResponse["intent"], string> = {
  signer_list: "Signer list",
  address_block: "Address block",
  email_field: "Notice email",
  clause: "Clause",
  mixed: "Mixed clip",
  junk: "Junk / skip",
};

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function App() {
  const [mode, setMode] = useState<ModeInfo>({ mode: "fixture", provider: null });
  const [clipboard, setClipboard] = useState(PRESETS[0].text);
  const [activePreset, setActivePreset] = useState<string | null>(PRESETS[0].id);
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace);
  const [result, setResult] = useState<ClassifyResponse | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [lastApplied, setLastApplied] = useState<string[]>([]);
  const [flash, setFlash] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/mode")
      .then((r) => r.json())
      .then((info: ModeInfo) => setMode(info))
      .catch(() => setMode({ mode: "fixture", provider: null }));
  }, []);

  const selectedProposals = useMemo(() => {
    if (!result) return [];
    return result.proposals.filter((p) => selected[p.id] !== false);
  }, [result, selected]);

  async function classify() {
    setBusy(true);
    setLastApplied([]);
    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipboard }),
      });
      const payload = (await response.json()) as ClassifyResponse;
      setResult(payload);
      setMode({ mode: payload.mode, provider: payload.provider });
      const next: Record<string, boolean> = {};
      for (const proposal of payload.proposals) {
        next[proposal.id] = proposal.confidence >= 0.45;
      }
      setSelected(next);
    } finally {
      setBusy(false);
    }
  }

  function loadPreset(id: string) {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setActivePreset(id);
    setClipboard(preset.text);
    setResult(null);
    setSelected({});
    setLastApplied([]);
  }

  function applyOne(proposal: Proposal) {
    setWorkspace((current) => applyProposal(current, proposal));
    setLastApplied([proposal.target]);
    setFlash([proposal.target]);
    window.setTimeout(() => setFlash([]), 900);
  }

  function applySelected() {
    setWorkspace((current) => applyProposals(current, selectedProposals));
    const targets = [...new Set(selectedProposals.map((p) => p.target))];
    setLastApplied(targets);
    setFlash(targets);
    window.setTimeout(() => setFlash([]), 900);
  }

  function resetWorkspace() {
    setWorkspace(emptyWorkspace());
    setLastApplied([]);
    setFlash([]);
  }

  const live = mode.mode === "live";

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="mark" aria-hidden="true">
            L
          </span>
          <div>
            <p className="brand-name">Lumin Sign</p>
            <p className="brand-sub">Document workspace · Jev smart-paste playground</p>
          </div>
        </div>
        <div className="top-meta">
          <span className={`badge ${live ? "live" : "fixture"}`}>
            <span className="dot" />
            {live ? "Live Jev" : "Fixture"}
          </span>
          {mode.provider ? <span className="quiet">{mode.provider}</span> : null}
        </div>
      </header>

      <p className="disclaimer">
        Self-contained playground inspired by{" "}
        <a href="https://x.com/marcus_lowe/status/2101476399488160013">Marcus Lowe’s Jaste</a>{" "}
        (TypeSafe Jev smart copy/paste). This is <strong>not</strong> the Jaste OS product.
      </p>

      <main className="layout">
        <section className="paper-wrap">
          <div className="paper-toolbar">
            <div>
              <p className="kicker">Draft envelope</p>
              <h1>{workspace.title}</h1>
            </div>
            <button type="button" className="ghost" onClick={resetWorkspace}>
              Reset workspace
            </button>
          </div>

          <article className="paper">
            <p className="paper-label">Parties & notice</p>
            <div className={`field ${flash.includes("company") ? "flash" : ""}`}>
              <span>Company / legal name</span>
              <strong className={workspace.company ? "" : "empty"}>
                {workspace.company || "Empty — apply a company proposal"}
              </strong>
            </div>
            <div className={`field ${flash.includes("address") ? "flash" : ""}`}>
              <span>Notice address</span>
              <strong className={workspace.address ? "pre" : "empty"}>
                {workspace.address || "Empty — apply an address proposal"}
              </strong>
            </div>
            <div className={`field ${flash.includes("email") ? "flash" : ""}`}>
              <span>Notice email</span>
              <strong className={workspace.email ? "" : "empty"}>
                {workspace.email || "Empty — apply an email proposal"}
              </strong>
            </div>

            <p className="paper-label">Signers</p>
            <div className={`signers ${flash.includes("signer") ? "flash" : ""}`}>
              {workspace.signers.length === 0 ? (
                <p className="empty">No signer chips yet. Classify a roster, then apply.</p>
              ) : (
                workspace.signers.map((signer) => (
                  <div key={signer.id} className={`chip ${signer.role}`}>
                    <span className="avatar">{signer.name.slice(0, 1)}</span>
                    <div>
                      <strong>{signer.name}</strong>
                      <em>{signer.email}</em>
                    </div>
                    <b>{signer.role}</b>
                  </div>
                ))
              )}
            </div>

            <p className="paper-label">Clause block</p>
            <div className={`clause ${flash.includes("clause") ? "flash" : ""}`}>
              {workspace.clause ? (
                <p>{workspace.clause}</p>
              ) : (
                <p className="empty">Empty — apply a clause proposal to fill this block.</p>
              )}
            </div>

            <div className="sig-row">
              <div className="sig">
                <i>Authorized signature</i>
                <b>{workspace.signers[0]?.name ?? "—"}</b>
              </div>
              <div className="sig">
                <i>Counterparty</i>
                <b>{workspace.signers[1]?.name ?? (workspace.company || "—")}</b>
              </div>
            </div>
          </article>

          {lastApplied.length ? (
            <p className="applied">
              Applied {lastApplied.map((t) => TARGET_LABELS[t as Proposal["target"]]).join(", ")}.
            </p>
          ) : null}
        </section>

        <aside className="clipboard">
          <div className="clip-head">
            <div>
              <p className="kicker">Smart clipboard</p>
              <h2>Classify → propose → apply</h2>
            </div>
          </div>

          <div className="presets" role="group" aria-label="Sample clipboard presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={activePreset === preset.id ? "on" : ""}
                onClick={() => loadPreset(preset.id)}
                title={preset.hint}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <label className="paste-label" htmlFor="clipboard">
            Messy clipboard text
          </label>
          <textarea
            id="clipboard"
            value={clipboard}
            onChange={(event) => {
              setClipboard(event.target.value);
              setActivePreset(null);
            }}
            rows={11}
            spellCheck={false}
          />

          <div className="actions">
            <button type="button" className="primary" disabled={busy || !clipboard.trim()} onClick={() => void classify()}>
              {busy ? "Classifying…" : "Classify paste"}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={!selectedProposals.length}
              onClick={applySelected}
            >
              Apply selected
            </button>
          </div>

          {result?.error ? <p className="error">{result.error}</p> : null}

          {result && !result.error ? (
            <div className="result">
              <div className="intent-card">
                <div>
                  <p className="kicker">Intent · Choice</p>
                  <strong>{INTENT_LABEL[result.intent]}</strong>
                </div>
                <div className="meters">
                  <span>confidence {pct(result.intent_confidence)}</span>
                  <span>
                    fit {result.fit_score.toFixed(2)} / 3 · {pct(result.fit_confidence)}
                  </span>
                  <span>
                    {result.latency_ms}ms · {result.mode === "live" ? "Live Jev" : "Fixture"}
                  </span>
                </div>
                <div className="probs">
                  {Object.entries(result.intent_probabilities)
                    .sort((a, b) => b[1] - a[1])
                    .map(([key, value]) => (
                      <div key={key}>
                        <span>{INTENT_LABEL[key as ClassifyResponse["intent"]] ?? key}</span>
                        <i style={{ width: pct(value) }} />
                        <b>{pct(value)}</b>
                      </div>
                    ))}
                </div>
              </div>

              <p className="kicker proposals-label">Proposed paste targets</p>
              {result.proposals.length === 0 ? (
                <p className="empty">No targets above the junk threshold. Try another preset.</p>
              ) : (
                <ul className="proposals">
                  {result.proposals.map((proposal) => (
                    <li key={proposal.id}>
                      <label className="proposal">
                        <input
                          type="checkbox"
                          checked={selected[proposal.id] !== false}
                          onChange={(event) =>
                            setSelected((current) => ({
                              ...current,
                              [proposal.id]: event.target.checked,
                            }))
                          }
                        />
                        <div className="proposal-body">
                          <header>
                            <strong>{proposal.label}</strong>
                            <span>{pct(proposal.confidence)}</span>
                          </header>
                          <p className="value">
                            {proposal.name ? `${proposal.name} · ` : ""}
                            {proposal.value}
                          </p>
                          <p className="reason">{proposal.reason}</p>
                          <div className="bar" aria-hidden="true">
                            <i style={{ width: pct(proposal.confidence) }} />
                          </div>
                          <button type="button" onClick={() => applyOne(proposal)}>
                            Apply this
                          </button>
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="hint">
              Load a preset, then classify. Fixture mode is deterministic and works offline. Set{" "}
              <code>JEV_API_KEY</code> for live TypeSafe System One.
            </p>
          )}
        </aside>
      </main>
    </div>
  );
}
