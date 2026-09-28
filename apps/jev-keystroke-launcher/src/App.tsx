import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { fetchMode, rankQuery } from "./api";
import { PRESET_QUERIES, WORKSPACE_NOW } from "./catalog";
import { highlightMatches } from "./highlight";
import type { ModeResponse, RankedItem, RankResponse } from "./types";

const DEBOUNCE_MS = 100;

const KIND_LABEL: Record<string, string> = {
  pdf: "PDF",
  doc: "Doc",
  signature: "Signature",
  folder: "Folder",
  template: "Template",
};

function formatWhen(iso?: string): string {
  if (!iso) return "—";
  const deltaMin = Math.round((Date.parse(WORKSPACE_NOW) - Date.parse(iso)) / 60_000);
  if (deltaMin < 1) return "just now";
  if (deltaMin < 60) return `${deltaMin} min ago`;
  const hours = Math.round(deltaMin / 60);
  if (hours < 36) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function kindGlyph(kind: string): string {
  switch (kind) {
    case "pdf":
      return "▭";
    case "doc":
      return "≡";
    case "signature":
      return "✎";
    case "folder":
      return "▣";
    default:
      return "▤";
  }
}

export function App() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<ModeResponse>({ mode: "fixture", provider: null });
  const [result, setResult] = useState<RankResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [opened, setOpened] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    fetchMode()
      .then(setMode)
      .catch(() => setMode({ mode: "fixture", provider: null }));
  }, []);

  const runRank = useCallback(async (nextQuery: string) => {
    const id = ++requestId.current;
    setPending(true);
    try {
      const ranked = await rankQuery(nextQuery);
      if (id !== requestId.current) return;
      setResult(ranked);
      setSelectedId(ranked.items[0]?.id ?? null);
    } catch {
      if (id !== requestId.current) return;
    } finally {
      if (id === requestId.current) setPending(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void runRank(query);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query, runRank]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const metaK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (metaK) {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = result?.items ?? [];
  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  );

  const move = (delta: number) => {
    if (items.length === 0) return;
    const index = Math.max(0, items.findIndex((item) => item.id === selected?.id));
    const next = items[(index + delta + items.length) % items.length];
    setSelectedId(next.id);
  };

  const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      setOpened(true);
    } else if (event.key === "Escape") {
      setOpened(false);
    }
  };

  const live = (result?.mode ?? mode.mode) === "live";
  const latency = result?.latency_ms;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="mark" aria-hidden>
            L
          </div>
          <div>
            <p className="brand-name">Lumin workspace</p>
            <h1>Keystroke launcher</h1>
          </div>
        </div>
        <div className="top-meta">
          <span className={`badge ${live ? "live" : "fixture"}`}>
            <span className="dot" />
            {live ? "Live Jev" : "Fixture mode"}
          </span>
          <span className="latency">
            {pending ? "ranking…" : latency != null ? `ranked in ${latency}ms` : "idle"}
          </span>
        </div>
      </header>

      <p className="lede">
        Predictive palette ranked by <em>intent</em>, not alias match. Inspired by{" "}
        <a href="https://x.com/dabit3/status/2100756930054504776">Nader Dabit × TypeSafe Jev</a>
        . Type “the pdf I just downloaded” — the newest PDF should already be #1.
      </p>

      <div className="workspace">
        <section className="palette" aria-label="Command palette">
          <label className="search">
            <span className="kbd">⌘K</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpened(false);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Search by intent — try a chip or start typing"
              autoFocus
              spellCheck={false}
              aria-label="Search workspace"
            />
          </label>

          <div className="chips" role="list">
            {PRESET_QUERIES.map((preset) => (
              <button
                key={preset.query}
                type="button"
                className={query === preset.query ? "on" : undefined}
                onClick={() => {
                  setQuery(preset.query);
                  setOpened(false);
                  inputRef.current?.focus();
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {result?.error ? <p className="error">Live Jev failed — fixture ranking used. {result.error}</p> : null}

          <ol className="results" aria-label="Ranked results">
            {items.map((item, index) => (
              <ResultRow
                key={item.id}
                item={item}
                index={index}
                query={query}
                active={item.id === selected?.id}
                onHover={() => setSelectedId(item.id)}
                onOpen={() => {
                  setSelectedId(item.id);
                  setOpened(true);
                }}
              />
            ))}
          </ol>
        </section>

        <DetailPane item={selected} opened={opened} onClose={() => setOpened(false)} />
      </div>
    </div>
  );
}

function ResultRow({
  item,
  index,
  query,
  active,
  onHover,
  onOpen,
}: {
  item: RankedItem;
  index: number;
  query: string;
  active: boolean;
  onHover: () => void;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={`row ${active ? "active" : ""}`}
        onMouseEnter={onHover}
        onClick={onOpen}
      >
        <span className="rank">{index + 1}</span>
        <span className={`glyph kind-${item.kind}`} aria-hidden>
          {kindGlyph(item.kind)}
        </span>
        <span className="row-body">
          <strong>{highlightMatches(item.title, query)}</strong>
          <em>
            {item.reasons.length > 0 ? item.reasons.join(" · ") : item.subtitle}
          </em>
        </span>
        <span className="row-meta">
          <span className="kind-pill">{KIND_LABEL[item.kind]}</span>
          <span className="score">{Math.round(item.score * 100)}</span>
        </span>
      </button>
    </li>
  );
}

function DetailPane({
  item,
  opened,
  onClose,
}: {
  item: RankedItem | null;
  opened: boolean;
  onClose: () => void;
}) {
  const [toast, setToast] = useState<string | null>(null);

  if (!item) {
    return (
      <aside className="detail">
        <p className="kicker">Detail</p>
        <p className="quiet">Select a result to inspect it. Nothing opens a real file.</p>
      </aside>
    );
  }

  return (
    <aside className={`detail ${opened ? "opened" : ""}`}>
      <p className="kicker">Preview · mock</p>
      <h2>{item.title}</h2>
      <p className="subtitle">{item.subtitle}</p>
      <dl>
        <div>
          <dt>Kind</dt>
          <dd>{KIND_LABEL[item.kind]}</dd>
        </div>
        {item.status ? (
          <div>
            <dt>Status</dt>
            <dd className={`status status-${item.status}`}>{item.status}</dd>
          </div>
        ) : null}
        {item.parties ? (
          <div>
            <dt>Parties</dt>
            <dd>{item.parties.join(", ")}</dd>
          </div>
        ) : null}
        <div>
          <dt>Downloaded</dt>
          <dd>{item.downloaded_at ? formatWhen(item.downloaded_at) : "—"}</dd>
        </div>
        <div>
          <dt>Modified</dt>
          <dd>{formatWhen(item.modified_at)}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{item.owner}</dd>
        </div>
        <div>
          <dt>Why this ranked</dt>
          <dd>{item.reasons.length ? item.reasons.join(" · ") : "Default recency"}</dd>
        </div>
      </dl>
      <div className="detail-actions">
        <button
          type="button"
          className="primary"
          onClick={() => {
            setToast(`Mock open — “${item.title}” is not a real file.`);
            window.setTimeout(() => setToast(null), 2400);
          }}
        >
          Open
        </button>
        <button type="button" className="ghost" onClick={onClose}>
          Close
        </button>
      </div>
      {toast ? <p className="toast">{toast}</p> : null}
      <p className="quiet">↑/↓ to move · Enter to preview · Esc to dismiss</p>
    </aside>
  );
}
