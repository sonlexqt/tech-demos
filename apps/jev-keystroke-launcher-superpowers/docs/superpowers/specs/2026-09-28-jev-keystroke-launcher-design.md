# Jev Keystroke Launcher (Superpowers twin) — Design

**Date:** 2026-09-28  
**App path:** `apps/jev-keystroke-launcher-superpowers/`  
**Classification:** architectural (new self-contained demo)  
**Companion:** quality twin of [PR #9](https://github.com/sonlexqt/tech-demos/pull/9) (`apps/jev-keystroke-launcher/`). Rebuilt independently; do not copy that source.  
**Source inspiration:** [Nader Dabit — keystroke oracle / predictive launcher](https://x.com/dabit3/status/2100756930054504776)

## Intent (locked brief)

A reviewer opens a Lumin-flavored command palette, types natural-language workspace intent, and watches results **re-rank by intent** after ~100ms debounce — not just alias or fuzzy title match. Classic proof: type **“the pdf I just downloaded”** and the newest downloaded PDF is #1.

This demo exists so `bun install && bun run dev` works with **no API key**. Live TypeSafe Jev is optional when `JEV_API_KEY` is set on the server.

**Success:** a reviewer can run the app, click the four preset chips, confirm deterministic ranking + why-hints, use ↑/↓/Enter to open a mock detail pane, and see a clear Fixture vs Live-Jev badge. PR includes README, screenshot, and video.

## Constraints

- Vite + TypeScript (React allowed), Bun scripts.
- Live Jev only via server / Vite proxy. Never `VITE_` prefix. Never commit secrets.
- Deterministic fixture ranking is the default path.
- Catalog: 12–20 Lumin-style workspace items.
- Debounce: 80–120ms (this spec locks **100ms**).
- No production Lumin API. No real file open. Do not modify `apps/jev-keystroke-launcher/`.
- Do not wipe `tracking/seen-bookmarks.json`. Do not add bookmark `2100756930054504776` again; README links companion PR #9.
- Superpowers artifacts stay under this app folder.

## Approaches considered

### A. Intent-first hybrid (chosen)

Classify the query into a small intent enum, then score catalog items with deterministic weights (kind, recency, signature state, lexical overlap). Optional live path: one `POST /v1/systemone` Choice over catalog IDs; client maps probabilities onto the same `RankedHit` shape.

- Pros: TDD-friendly, works offline, one Jev round-trip, matches the “intent not fuzzy” story.
- Cons: fixture intents are a closed set; novel phrasing falls back to lexical + recency.

### B. Per-item Score fan-out

Ask Jev a Score question per item (or one request with N Score questions). Rank by score.

- Pros: closest to “Jev scores every row.”
- Cons: slower/costlier on every keystroke; hard to demo without a key; fixture twin would still need a local scorer.

### C. Fuzzy launcher with Jev as garnish

Classic string match; Jev only writes why-hints.

- Pros: trivial.
- Cons: contradicts the brief. Rejected.

**Decision:** Approach A.

## Architecture

```
Browser (Vite + React)
  Palette UI ──100ms debounce──► rankWorkspace(query, catalog)
                                      │
                                      ├─ fixture: local intent + scores
                                      └─ live: POST /api/rank (same RankedHit[])
  Detail pane ◄── selected hit (mock open)

Vite plugin (Node, process.env.JEV_API_KEY)
  GET  /api/rank-mode  → { mode: "fixture" | "live" }
  POST /api/rank       → { hits, mode, source }
       live: TypeSafe POST https://api.typesafe.ai/v1/systemone
       no key / Jev error: fixture ranker (same function as client)
```

The **ranker is a pure function**. UI, debounce, and the Vite plugin all call it or return the same `RankedHit[]` contract. Live Jev never ships the API key to the browser.

## Components and files

| Unit | Responsibility | Depends on |
| --- | --- | --- |
| `src/catalog/types.ts` | `WorkspaceItem`, `ItemKind`, `SignatureState`, `RankedHit` | — |
| `src/catalog/fixtures.ts` | 16 frozen items + `NOW` clock pin | types |
| `src/ranker/intents.ts` | `detectIntent(query) → LauncherIntent` | — |
| `src/ranker/score.ts` | `rankWorkspace(query, items, now) → RankedHit[]` | intents, types |
| `src/ranker/presets.ts` | Four chip query strings | — |
| `src/lib/debounce.ts` | `debounce(fn, 100)` | — |
| `src/api/rank-client.ts` | `fetchRank`, `fetchRankMode` | RankedHit |
| `server/jev-proxy.ts` | Vite middleware: mode + live Choice | ranker, catalog |
| `src/ui/*` | Palette, chips, list, detail, badge | rank-client, presets |

Each unit has one job. Ranker tests do not import React. UI does not contain scoring math.

## Data model

```ts
type ItemKind = "pdf" | "doc" | "signature_request" | "folder" | "template";

type SignatureStatus =
  | "waiting"
  | "countersign"
  | "expired"
  | "completed"
  | "draft";

interface SignatureMeta {
  status: SignatureStatus;
  waitingOn?: string;      // e.g. "legal"
  documentType?: string;   // e.g. "MSA"
  expiresAt?: string;      // ISO
}

interface WorkspaceItem {
  id: string;              // stable slug, e.g. "q3-board-deck"
  title: string;
  kind: ItemKind;
  subtitle: string;        // one-line workspace context
  tags: string[];
  modifiedAt: string;      // ISO
  downloadedAt?: string;   // ISO; only real downloads
  signature?: SignatureMeta;
}

interface RankedHit {
  item: WorkspaceItem;
  score: number;           // higher is better
  reasons: string[];       // short why-ranked hints, 1–3
  intent: LauncherIntent;
}

type LauncherIntent =
  | "newest_download"
  | "waiting_legal"
  | "msa_countersign"
  | "expired_signature"
  | "generic";
```

`NOW` for fixtures is pinned to **`2026-09-28T12:00:00.000Z`** so recency tests are stable.

## Fixture catalog (16 items)

Clock pin: `NOW = 2026-09-28T12:00:00.000Z`. All timestamps below are UTC.

| id | title | kind | modifiedAt | downloadedAt | signature / tags |
| --- | --- | --- | --- | --- | --- |
| `q3-board-deck` | Q3 Board Deck.pdf | pdf | 2026-09-27T18:00:00Z | **2026-09-28T10:15:00Z** (newest download) | tags: `pdf`, `board` |
| `vendor-invoice` | Vendor Invoice — Acme.pdf | pdf | 2026-09-20T16:10:00Z | 2026-09-20T16:00:00Z | tags: `pdf`, `invoice` |
| `office-lease` | Office Lease 2024.pdf | pdf | 2026-08-01T12:00:00Z | — | tags: `pdf`, `lease` |
| `brand-guidelines` | Brand Guidelines.pdf | pdf | 2026-07-04T09:30:00Z | 2026-07-04T09:00:00Z | tags: `pdf`, `brand` |
| `nda-acme` | NDA — Acme Corp | doc | 2026-09-18T09:00:00Z | — | tags: `nda`, `legal` |
| `offer-letter` | Offer Letter — Rivera | doc | 2026-09-12T15:00:00Z | — | tags: `hr` |
| `security-policy` | Security Policy v3 | doc | 2026-06-02T11:00:00Z | — | tags: `security` |
| `msa-northwind` | MSA — Northwind | signature_request | 2026-09-25T10:00:00Z | — | `countersign`, `documentType: MSA` |
| `msa-globex` | MSA — Globex (draft) | signature_request | 2026-09-22T10:00:00Z | — | `draft`, `documentType: MSA` |
| `sow-legal-wait` | SOW — Contoso | signature_request | **2026-09-26T14:00:00Z** | — | `waiting`, `waitingOn: legal` |
| `dpa-legal-wait` | DPA — Contoso | signature_request | 2026-09-24T11:00:00Z | — | `waiting`, `waitingOn: legal` |
| `expired-nda` | NDA — Expired countersign | signature_request | **2026-09-10T08:00:00Z** | — | `expired`, `expiresAt: 2026-09-01T00:00:00Z` |
| `expired-order` | Order Form — Lapsed | signature_request | 2026-08-16T08:00:00Z | — | `expired`, `expiresAt: 2026-08-15T00:00:00Z` |
| `signed-pilot` | Pilot Agreement — Done | signature_request | 2026-09-08T13:00:00Z | — | `completed` |
| `templates-folder` | Templates | folder | 2026-05-01T12:00:00Z | — | tags: `folder` |
| `msa-template` | MSA template | template | 2026-09-15T12:00:00Z | — | tags: `msa`, `template` — must **not** beat `msa-northwind` on the MSA chip |

Subtitles are one-line workspace context derived from the row (e.g. `Downloaded today · PDF`). They must not change ranking.

## Intent detection

`detectIntent(query: string): LauncherIntent` lowercases and collapses whitespace, then matches **in this order** (first hit wins):

1. **`newest_download`** — query contains `pdf` **and** at least one of: `just downloaded`, `downloaded`, `newest`, `latest download`.
2. **`waiting_legal`** — query contains `waiting` **and** (`legal` or `sign`).
3. **`msa_countersign`** — query contains `msa` **and** (`countersign` or `counter sign` or `counter-sign`).
4. **`expired_signature`** — query contains `expired` **and** (`sign` or `signature`).
5. **`generic`** — otherwise.

Preset strings (exact, exported from `presets.ts`):

- `the pdf I just downloaded`
- `waiting on legal to sign`
- `MSA countersign`
- `expired signature requests`

Empty / whitespace-only query is **`generic`**. Ranking then uses recency only (`modifiedAt` descending) with reason `"recent activity"`.

## Fixture scoring

`rankWorkspace(query, items, now = NOW)`:

1. `intent = detectIntent(query)`.
2. Score every item (numbers below are exact).
3. Sort by `score` desc, then `modifiedAt` desc, then `id` asc.
4. Always return **all** items (no filtering). Reasons: 1–3 unique strings, most specific first.

### Base score

- Lexical overlap: +8 per query token (length ≥ 3, split on non-alphanumeric) that appears in `title` or `tags` (case-insensitive).
- Recency: `max(0, 6 - ageDays/7)` using `modifiedAt` vs `now` (not an extra bonus on top of intent recency).

### Intent bonuses (additive)

**`newest_download`**

- `kind === "pdf"` and `downloadedAt` present: `+40`, reason `"newest download"`.
- Among those, the max `downloadedAt` gets **additional `+30`**, reason `"downloaded most recently"`.
- Other PDFs without `downloadedAt`: `+8`, reason `"pdf"`.
- Non-PDFs: no intent bonus.

Expected #1 for the first preset: **`q3-board-deck`**.

**`waiting_legal`**

- `signature.status === "waiting"` and `waitingOn === "legal"`: `+50`, reason `"waiting on legal"`.
- Other `waiting` signatures: `+20`, reason `"awaiting signature"`.

Expected #1: **`sow-legal-wait`** or **`dpa-legal-wait`** (tie-break `modifiedAt` then `id`). Lock fixture dates so **`sow-legal-wait`** is #1 (`modifiedAt: 2026-09-26T14:00:00Z` vs DPA `2026-09-24T11:00:00Z`).

**`msa_countersign`**

- `signature.documentType === "MSA"` and `status === "countersign"`: `+55`, reason `"MSA awaiting countersign"`.
- Other MSA signatures: `+18`, reason `"MSA"`.
- Template tagged `msa`: `+6` only (must stay below real MSA requests).

Expected #1: **`msa-northwind`**.

**`expired_signature`**

- `signature.status === "expired"`: `+50`, reason `"expired signature request"`.
- Completed/draft are not expired.

Expected #1: **`expired-nda`** (`modifiedAt` newer than `expired-order`).

**`generic`**

- No intent bonus. Lexical + recency only. Reason includes `"title match"` when lexical > 0, else `"recent activity"`.

## Live Jev (optional)

**When:** `process.env.JEV_API_KEY` is a non-empty string in the Vite Node process.

**Endpoints (Vite plugin, not a separate server):**

- `GET /api/rank-mode` → `{ "mode": "fixture" | "live" }`
- `POST /api/rank` body `{ "query": string }` → `{ "hits": RankedHit[], "mode": "fixture" | "live", "source": "jev" | "fixture" }`

**Client:** after debounce, if mode is `live`, POST `/api/rank`. If the request fails (network, 4xx/5xx, timeout 4s), fall back to local `rankWorkspace` and keep the badge as **Live Jev** only when `/api/rank-mode` said live; list may show a one-line `"Jev unreachable — fixture ranking"` note. Badge text:

- Fixture: **`Fixture mode`**
- Live: **`Live Jev`**

Never put the key in client code, import.meta.env, or `.env` committed files. Ship `.env.example` with `JEV_API_KEY=` commented.

**Upstream call** (server only):

```
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <JEV_API_KEY>
Content-Type: application/json
```

```json
{
  "model": "jev-1.13.0",
  "state": {
    "query": "<user query>",
    "catalog": [{ "id": "...", "title": "...", "kind": "...", "subtitle": "...", "tags": [], "downloadedAt": null, "signature": null }]
  },
  "questions": {
    "best_item": {
      "type": "choice",
      "instructions": "Which catalog item best matches the user's launcher intent? Prefer recency for downloads, waiting-on-legal for signature waits, MSA countersign for MSA countersign, expired requests for expired phrasing.",
      "criteria": {
        "<item.id>": "<title> — <kind>; <one-line facts>"
      }
    }
  }
}
```

Map `answers.best_item.probabilities` onto items: `score = round(probability * 1000)`. Winner also gets `+1` so it sorts first on ties. Reasons: `"Jev choice <id>"` plus `"p=<0.00-1.00>"`. If Jev omits an id, probability is 0; still return all items, filling missing scores with 0 and sorting by the fixture ranker as a stable secondary key (`score` desc, then fixture score desc, then id).

`source: "jev"` only when the Choice answer is present. Any parse/HTTP failure → fixture ranker, `source: "fixture"`.

## UX

- **Always-visible** palette (not a hidden modal). `Cmd/Ctrl+K` focuses the search input.
- Search field + ranked list (title, kind chip, 1–2 reason hints, relative recency).
- Four preset chips fill the input and trigger rank immediately (still go through the same debounce helper with leading flush **or** chips call rank directly — **chips call `rankWorkspace` / `/api/rank` immediately**; typing uses 100ms debounce).
- Keyboard: ↑/↓ move highlight; Enter selects highlighted row (default highlight = index 0 after each re-rank).
- Selection opens a **mock detail pane**: title, kind, timestamps, signature block, tags, and an **Open** button that sets status text `Opened in mock viewer (no file)`. No `window.open`, no downloads.
- Visual: Lumin-flavored workspace — deep ink background, violet accent, compact Inter-like system stack, palette card with soft elevation. Not a generic dark-mode clone of Spotlight.

## Error handling

| Case | Behavior |
| --- | --- |
| Empty query | Rank all by recency; no error |
| Live key missing | Fixture only; badge Fixture mode |
| Live Jev 401/4xx/5xx/timeout | Fixture hits + inline note; badge still Live Jev |
| Malformed POST body | 400 `{ error: "query required" }` |
| Client abort on new keystroke | Ignore stale responses (monotonic request id) |

## Testing

Bun test (`bun:test`). Prefer TDD on ranker and debounce.

Required cases:

- `detectIntent` for each preset string and for empty / unrelated text.
- `rankWorkspace("the pdf I just downloaded")` → `[0].item.id === "q3-board-deck"` and reasons include `"downloaded most recently"`.
- Waiting / MSA / expired presets → locked #1 ids above.
- MSA template does not outrank `msa-northwind`.
- Empty query returns 16 hits, sorted by `modifiedAt` desc.
- Debounce: function called once after 100ms of silence (fake timers).
- Jev mapper: given a probabilities object, winner is first; missing ids get 0.

No test may read `apps/jev-keystroke-launcher/`.

## Manual verification (README)

1. `cd apps/jev-keystroke-launcher-superpowers && bun install && bun run dev`
2. Open http://localhost:5173/ — badge **Fixture mode**.
3. Chip **the pdf I just downloaded** → Q3 Board Deck.pdf is #1; detail matches.
4. Other three chips re-rank as specified.
5. Type the classic phrase with debounce; list updates; ↑/↓/Enter opens mock detail; Open is mock.
6. Optional: local `JEV_API_KEY` (not committed) flips badge to **Live Jev**.

## Out of scope

Production Lumin APIs, real file I/O, auth, deploy, tracking JSON edits, copying PR #9 source, extra Superpowers visual companion.

## Self-review (2026-09-28)

- Placeholders: none. Debounce locked to 100ms; catalog size locked to 16; #1 ids locked.
- Consistency: live and fixture share `RankedHit`; badge vs fallback note distinguished.
- Scope: one demo app; one implementation plan.
- Ambiguity resolved: chips skip debounce; empty query is generic recency; live failures keep Live Jev badge and show a note; MSA template must lose to `msa-northwind`.
