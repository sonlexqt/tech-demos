import { useEffect, useMemo, useRef, useState } from "react";
import { fetchRank, fetchRankMode } from "../api/rank-client";
import type { RankMode } from "../api/rank-types";
import { NOW } from "../catalog/fixtures";
import type { ItemKind, RankedHit, WorkspaceItem } from "../catalog/types";
import { debounce } from "../lib/debounce";
import { isStaleEpoch } from "../lib/request-epoch";
import { PRESET_QUERIES } from "../ranker/presets";
import { rankWorkspace } from "../ranker/score";

const KIND_LABEL: Record<ItemKind, string> = {
  pdf: "PDF",
  doc: "Doc",
  signature_request: "Signature",
  folder: "Folder",
  template: "Template",
};

function formatWhen(iso?: string): string {
  if (!iso) {
    return "—";
  }
  const delta = NOW.getTime() - new Date(iso).getTime();
  const hours = Math.round(delta / (1000 * 60 * 60));
  if (hours < 1) {
    return "just now";
  }
  if (hours < 48) {
    return `${hours}h ago`;
  }
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function Palette() {
  const inputRef = useRef<HTMLInputElement>(null);
  const epochRef = useRef(0);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<RankedHit[]>(() => rankWorkspace(""));
  const [highlight, setHighlight] = useState(0);
  const [selected, setSelected] = useState<WorkspaceItem | null>(
    () => rankWorkspace("")[0]?.item ?? null,
  );
  const [mode, setMode] = useState<RankMode>("fixture");
  const [note, setNote] = useState<string | undefined>();
  const [openStatus, setOpenStatus] = useState<string | null>(null);

  const applyHits = (next: RankedHit[], nextNote?: string) => {
    setHits(next);
    setHighlight(0);
    setSelected(next[0]?.item ?? null);
    setNote(nextNote);
    setOpenStatus(null);
  };

  const runRank = async (nextQuery: string, _immediate: boolean) => {
    const epoch = ++epochRef.current;
    if (mode === "live") {
      try {
        const response = await fetchRank(nextQuery);
        if (isStaleEpoch(epoch, epochRef.current)) {
          return;
        }
        applyHits(response.hits, response.note);
      } catch {
        if (isStaleEpoch(epoch, epochRef.current)) {
          return;
        }
        applyHits(rankWorkspace(nextQuery), "Jev unreachable — fixture ranking");
      }
      return;
    }
    applyHits(rankWorkspace(nextQuery));
  };

  const debouncedRank = useMemo(
    () => debounce((value: string) => void runRank(value, false), 100),
    [mode],
  );

  useEffect(() => {
    return () => debouncedRank.cancel();
  }, [debouncedRank]);

  useEffect(() => {
    void fetchRankMode().then((next) => {
      setMode(next);
    });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onQueryChange = (value: string) => {
    setQuery(value);
    debouncedRank(value);
  };

  const onChip = (value: string) => {
    debouncedRank.cancel();
    setQuery(value);
    void runRank(value, true);
  };

  const moveHighlight = (delta: number) => {
    if (hits.length === 0) {
      return;
    }
    setHighlight((current) => {
      const next = (current + delta + hits.length) % hits.length;
      setSelected(hits[next].item);
      return next;
    });
  };

  const selectHighlighted = () => {
    const hit = hits[highlight];
    if (hit) {
      setSelected(hit.item);
      setOpenStatus(null);
    }
  };

  return (
    <div className="workspace">
      <section className="palette" aria-label="Intent palette">
        <div className="palette-head">
          <label className="search-label" htmlFor="launcher-search">
            Search workspace
          </label>
          <div className="search-row">
            <input
              id="launcher-search"
              ref={inputRef}
              value={query}
              autoFocus
              placeholder="the pdf I just downloaded"
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  moveHighlight(1);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  moveHighlight(-1);
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  selectHighlighted();
                }
              }}
            />
            <span className={`badge ${mode === "live" ? "badge-live" : "badge-fixture"}`}>
              {mode === "live" ? "Live Jev" : "Fixture mode"}
            </span>
          </div>
          <p className="hint">⌘K / Ctrl+K focuses search · ↑↓ Enter opens mock detail</p>
        </div>

        <div className="chips" role="list">
          {PRESET_QUERIES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={query === preset.query ? "chip chip-active" : "chip"}
              onClick={() => onChip(preset.query)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {note ? <p className="note">{note}</p> : null}

        <ol className="results">
          {hits.map((hit, index) => (
            <li key={hit.item.id}>
              <button
                type="button"
                className={index === highlight ? "row row-active" : "row"}
                onClick={() => {
                  setHighlight(index);
                  setSelected(hit.item);
                  setOpenStatus(null);
                }}
              >
                <span className={`kind kind-${hit.item.kind}`}>
                  {KIND_LABEL[hit.item.kind]}
                </span>
                <span className="row-copy">
                  <span className="row-title">{hit.item.title}</span>
                  <span className="row-meta">
                    {hit.reasons.slice(0, 2).join(" · ") || hit.item.subtitle}
                  </span>
                </span>
                <span className="when">{formatWhen(hit.item.modifiedAt)}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <aside className="detail" aria-live="polite">
        {selected ? (
          <>
            <p className="detail-kicker">{KIND_LABEL[selected.kind]}</p>
            <h2>{selected.title}</h2>
            <p className="detail-sub">{selected.subtitle}</p>
            <dl>
              <div>
                <dt>Modified</dt>
                <dd>{selected.modifiedAt}</dd>
              </div>
              <div>
                <dt>Downloaded</dt>
                <dd>{selected.downloadedAt ?? "—"}</dd>
              </div>
              <div>
                <dt>Signature</dt>
                <dd>
                  {selected.signature
                    ? [
                        selected.signature.status,
                        selected.signature.waitingOn,
                        selected.signature.documentType,
                        selected.signature.expiresAt
                          ? `expires ${selected.signature.expiresAt}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Tags</dt>
                <dd>{selected.tags.join(", ")}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="open"
              onClick={() => setOpenStatus("Opened in mock viewer (no file)")}
            >
              Open
            </button>
            {openStatus ? <p className="open-status">{openStatus}</p> : null}
          </>
        ) : (
          <p>Select a result to inspect it.</p>
        )}
      </aside>
    </div>
  );
}
