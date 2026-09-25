import { useEffect, useMemo, useState } from "react";
import { dtoIssues, emptyWorkspace, formatExpires, toSignatureRequestDTO } from "./dto";
import { PRESETS } from "./presets";
import type { ClassifyResponse, ModeInfo, Proposal, Workspace } from "./types";
import { TARGET_LABELS, applyProposal, applyProposals } from "./workspace";

const INTENT_LABEL: Record<ClassifyResponse["intent"], string> = {
  signer_list: "signers[]",
  request_meta: "Request meta",
  viewer_list: "viewers[]",
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
  const [workspace, setWorkspace] = useState<Workspace>(() => emptyWorkspace());
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

  const dto = useMemo(() => toSignatureRequestDTO(workspace), [workspace]);
  const issues = useMemo(() => dtoIssues(workspace), [workspace]);
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
      for (const proposal of payload.proposals) next[proposal.id] = proposal.confidence >= 0.45;
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

  function markFlash(targets: string[]) {
    setLastApplied(targets);
    setFlash(targets);
    window.setTimeout(() => setFlash([]), 900);
  }

  function applyOne(proposal: Proposal) {
    setWorkspace((current) => applyProposal(current, proposal));
    markFlash([proposal.target]);
  }

  function applySelected() {
    setWorkspace((current) => applyProposals(current, selectedProposals));
    markFlash([...new Set(selectedProposals.map((p) => p.target))]);
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
            <p className="brand-name">Lumin Send</p>
            <p className="brand-sub">SignatureRequestDTO playground · Jev smart paste</p>
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
        Shapes{" "}
        <a href="https://developers.luminpdf.com/tabs/api-reference/api/signature-requests/send-signature-request">
          POST /v1/signature_request/send
        </a>{" "}
        from messy clipboard text. Inspired by{" "}
        <a href="https://x.com/marcus_lowe/status/2101476399488160013">Marcus Lowe’s Jaste</a>.{" "}
        <strong>Not</strong> Jaste itself, and this demo does not call <code>api.luminpdf.com</code>.
      </p>

      <main className="layout">
        <section className="editor-wrap">
          <div className="paper-toolbar">
            <div>
              <p className="kicker">MSA countersign · FY26</p>
              <h1>SignatureRequestDTO</h1>
            </div>
            <button type="button" className="ghost" onClick={() => setWorkspace(emptyWorkspace())}>
              Reset DTO
            </button>
          </div>

          <div className={`field ${flash.includes("title") ? "flash" : ""}`}>
            <span>
              <code>title</code> · required
            </span>
            <strong className={workspace.title ? "" : "empty"}>{workspace.title || "Missing — apply a title proposal"}</strong>
          </div>
          <div className={`field ${flash.includes("signing_type") ? "flash" : ""}`}>
            <span>
              <code>signing_type</code> · SAME_TIME | ORDER
            </span>
            <strong>{workspace.signing_type}</strong>
          </div>
          <div className={`field ${flash.includes("expires_at") ? "flash" : ""}`}>
            <span>
              <code>expires_at</code> · unix epoch milliseconds
            </span>
            <strong>
              {workspace.expires_at}
              <em className="iso"> {formatExpires(workspace.expires_at)}</em>
            </strong>
          </div>
          <div className="field">
            <span>
              <code>file_url</code> · sample PDF (no upload)
            </span>
            <strong className="url">{workspace.file_url}</strong>
          </div>
          <div className={`field ${flash.includes("use_text_tags") ? "flash" : ""}`}>
            <span>
              <code>use_text_tags</code>
            </span>
            <strong>{String(workspace.use_text_tags)}</strong>
          </div>

          <p className="paper-label">
            <code>signers[]</code> · name, email_address, group?
          </p>
          <div className={`people ${flash.includes("signer") || flash.includes("verification") ? "flash" : ""}`}>
            {workspace.signers.length === 0 ? (
              <p className="empty">No signers — classify an ordered roster, then apply.</p>
            ) : (
              workspace.signers
                .slice()
                .sort((a, b) => (a.group ?? 99) - (b.group ?? 99))
                .map((signer) => (
                  <div key={signer.email_address} className="chip">
                    <span className="avatar">{signer.group ?? "–"}</span>
                    <div>
                      <strong>{signer.name}</strong>
                      <em>{signer.email_address}</em>
                    </div>
                    <b>
                      {signer.group != null ? `group ${signer.group}` : "no group"}
                      {signer.verification ? " · vc" : ""}
                    </b>
                  </div>
                ))
            )}
          </div>

          <p className="paper-label">
            <code>viewers[]</code> · name, email_address
          </p>
          <div className={`people ${flash.includes("viewer") ? "flash" : ""}`}>
            {workspace.viewers.length === 0 ? (
              <p className="empty">No viewers.</p>
            ) : (
              workspace.viewers.map((viewer) => (
                <div key={viewer.email_address} className="chip viewer">
                  <span className="avatar">V</span>
                  <div>
                    <strong>{viewer.name}</strong>
                    <em>{viewer.email_address}</em>
                  </div>
                  <b>viewer</b>
                </div>
              ))
            )}
          </div>

          <p className="paper-label">
            <code>custom_email</code>
          </p>
          <div className={`field ${flash.some((t) => t.startsWith("custom_email")) ? "flash" : ""}`}>
            <span>
              <code>subject_name</code> / <code>title</code> / <code>sender_email</code>
            </span>
            <strong className={workspace.custom_email.subject_name || workspace.custom_email.title ? "" : "empty"}>
              {workspace.custom_email.subject_name || workspace.custom_email.title
                ? [
                    workspace.custom_email.subject_name && `subject_name: ${workspace.custom_email.subject_name}`,
                    workspace.custom_email.title && `title: ${workspace.custom_email.title}`,
                    workspace.custom_email.sender_email && `sender_email: ${workspace.custom_email.sender_email}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "Empty — apply from a thread snippet"}
            </strong>
          </div>

          <div className="json-head">
            <p className="paper-label">Outgoing JSON · POST /v1/signature_request/send</p>
            <span className={`validity ${issues.length ? "warn" : "ok"}`}>
              {issues.length ? `Incomplete: ${issues.join(", ")}` : "Required fields present · not sent"}
            </span>
          </div>
          <pre className="json" aria-label="SignatureRequestDTO JSON preview">
            {JSON.stringify(dto, null, 2)}
          </pre>
          {lastApplied.length ? (
            <p className="applied">Applied {lastApplied.map((t) => TARGET_LABELS[t as Proposal["target"]] ?? t).join(", ")}.</p>
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
            <button type="button" className="secondary" disabled={!selectedProposals.length} onClick={applySelected}>
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

              <p className="kicker proposals-label">Proposed DTO writes</p>
              {result.proposals.length === 0 ? (
                <p className="empty">Nothing to apply — junk was ignored.</p>
              ) : (
                <ul className="proposals">
                  {result.proposals.map((proposal) => (
                    <li key={proposal.id}>
                      <label className="proposal">
                        <input
                          type="checkbox"
                          checked={selected[proposal.id] !== false}
                          onChange={(event) =>
                            setSelected((current) => ({ ...current, [proposal.id]: event.target.checked }))
                          }
                        />
                        <div className="proposal-body">
                          <header>
                            <strong>{proposal.label}</strong>
                            <span>{pct(proposal.confidence)}</span>
                          </header>
                          <p className="path">
                            <code>{proposal.path}</code>
                          </p>
                          <p className="value">
                            {proposal.name ? `${proposal.name} · ` : ""}
                            {proposal.target === "expires_at"
                              ? `${proposal.value} (${formatExpires(Number(proposal.value))})`
                              : proposal.value}
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
              Load a preset, then classify. Fixture mode is deterministic. Set <code>JEV_API_KEY</code> for live
              TypeSafe System One.
            </p>
          )}
        </aside>
      </main>
    </div>
  );
}
