# Jev Keystroke Launcher (Superpowers) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an independent Lumin-flavored intent-ranked command palette under `apps/jev-keystroke-launcher-superpowers/` that matches the locked spec without copying PR #9.

**Architecture:** Pure TypeScript ranker (intent → scores → `RankedHit[]`) is the source of truth. React palette debounces typing at 100ms. Optional live Jev is a Vite middleware Choice call that maps probabilities onto the same `RankedHit` shape. Fixture mode is default.

**Tech Stack:** Bun, Vite 6, React 19, TypeScript 5.7, `bun:test`

**Spec:** `apps/jev-keystroke-launcher-superpowers/docs/superpowers/specs/2026-09-28-jev-keystroke-launcher-design.md`

## Global Constraints

- App lives only under `apps/jev-keystroke-launcher-superpowers/` (plus this plan/spec already there).
- Do not read, copy, or modify `apps/jev-keystroke-launcher/` or branch `cursor/jev-keystroke-launcher-8857`.
- Do not edit `tracking/seen-bookmarks.json`.
- Debounce wait is **100ms**. Catalog size is **16**. Clock pin is **`2026-09-28T12:00:00.000Z`**.
- Live key env name is **`JEV_API_KEY`** (never `VITE_JEV_API_KEY`). Model **`jev-1.13.0`**. Endpoint **`https://api.typesafe.ai/v1/systemone`**.
- Badge copy is exactly **`Fixture mode`** or **`Live Jev`**.
- Preset query strings are exactly: `the pdf I just downloaded`, `waiting on legal to sign`, `MSA countersign`, `expired signature requests`.
- TDD on every task that produces logic: write the named test, watch it fail, then implement.
- `bun install && bun run dev` must work with no key.

## Review Focus

- Whitespace-only query must rank like empty (generic recency, 16 hits) — Task 3.
- Intent detection is case-insensitive (`THE PDF I JUST DOWNLOADED` → `newest_download`) — Task 2.
- Jev probabilities for unknown ids are ignored (score 0, not thrown) — Task 5.
- Equal score + equal `modifiedAt` sorts by `id` ascending — Task 3.
- `debounce.cancel()` prevents a pending invocation — Task 4.

---

### Task 1: Scaffold + types + fixtures

**Files:**
- Create: `apps/jev-keystroke-launcher-superpowers/package.json`
- Create: `apps/jev-keystroke-launcher-superpowers/tsconfig.json`
- Create: `apps/jev-keystroke-launcher-superpowers/tsconfig.node.json`
- Create: `apps/jev-keystroke-launcher-superpowers/vite.config.ts`
- Create: `apps/jev-keystroke-launcher-superpowers/index.html`
- Create: `apps/jev-keystroke-launcher-superpowers/.env.example`
- Create: `apps/jev-keystroke-launcher-superpowers/src/catalog/types.ts`
- Create: `apps/jev-keystroke-launcher-superpowers/src/catalog/fixtures.ts`
- Create: `apps/jev-keystroke-launcher-superpowers/src/catalog/fixtures.test.ts`

**Interfaces:**
- Consumes: spec catalog table (16 rows, pinned timestamps)
- Produces: `WorkspaceItem`, `ItemKind`, `SignatureStatus`, `SignatureMeta`, `RankedHit`, `LauncherIntent`, `NOW`, `FIXTURE_ITEMS` (`readonly WorkspaceItem[]`, length 16), `findFixture(id: string): WorkspaceItem`

- [ ] **Step 1: Write the failing test**

In `src/catalog/fixtures.test.ts` using `bun:test`:

```ts
test("fixture catalog has 16 items and newest download is q3-board-deck", () => {
  expect(FIXTURE_ITEMS).toHaveLength(16);
  const downloads = FIXTURE_ITEMS.filter((i) => i.downloadedAt);
  const newest = downloads.reduce((a, b) =>
    a.downloadedAt! > b.downloadedAt! ? a : b,
  );
  expect(newest.id).toBe("q3-board-deck");
  expect(newest.downloadedAt).toBe("2026-09-28T10:15:00.000Z");
  expect(NOW.toISOString()).toBe("2026-09-28T12:00:00.000Z");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/jev-keystroke-launcher-superpowers && bun test src/catalog/fixtures.test.ts`
Expected: FAIL (module or `FIXTURE_ITEMS` not defined)

- [ ] **Step 3: Implement types, fixtures, and Bun/Vite scaffold**

`package.json` scripts: `"dev": "vite"`, `"build": "tsc -b && vite build"`, `"test": "bun test"`. Dependencies: `react`, `react-dom`. Dev: `vite`, `typescript`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`. Vite port **5173**, `strictPort: true`. `.env.example` contains `# JEV_API_KEY=` only. Types and `FIXTURE_ITEMS` match the spec table; ISO strings use the `.000Z` form. `index.html` may be a placeholder root until Task 7.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/jev-keystroke-launcher-superpowers && bun test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/jev-keystroke-launcher-superpowers
git commit -m "feat: scaffold launcher fixtures and types"
```

---

### Task 2: Intent detection

**Files:**
- Create: `apps/jev-keystroke-launcher-superpowers/src/ranker/intents.ts`
- Create: `apps/jev-keystroke-launcher-superpowers/src/ranker/intents.test.ts`
- Create: `apps/jev-keystroke-launcher-superpowers/src/ranker/presets.ts`

**Interfaces:**
- Consumes: `LauncherIntent` from types
- Produces: `detectIntent(query: string): LauncherIntent`; `PRESET_QUERIES` as `readonly { id: string; label: string; query: string }[]` with ids `pdf-downloaded`, `waiting-legal`, `msa-countersign`, `expired-signatures` and the four exact query strings

- [ ] **Step 1: Write the failing test**

```ts
test("maps each preset query to its intent", () => {
  expect(detectIntent("the pdf I just downloaded")).toBe("newest_download");
  expect(detectIntent("waiting on legal to sign")).toBe("waiting_legal");
  expect(detectIntent("MSA countersign")).toBe("msa_countersign");
  expect(detectIntent("expired signature requests")).toBe("expired_signature");
});

test("detectIntent is case-insensitive and trims whitespace", () => {
  expect(detectIntent("  THE PDF I JUST DOWNLOADED  ")).toBe("newest_download");
});

test("unrelated and empty queries are generic", () => {
  expect(detectIntent("")).toBe("generic");
  expect(detectIntent("brand guidelines")).toBe("generic");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/jev-keystroke-launcher-superpowers && bun test src/ranker/intents.test.ts`
Expected: FAIL (`detectIntent` not defined)

- [ ] **Step 3: Implement `detectIntent` and `PRESET_QUERIES`**

Match spec order: newest_download → waiting_legal → msa_countersign → expired_signature → generic. Collapse whitespace and lowercase before matching.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/jev-keystroke-launcher-superpowers && bun test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/jev-keystroke-launcher-superpowers/src/ranker
git commit -m "feat: detect launcher intent from query text"
```

---

### Task 3: Fixture ranker

**Files:**
- Create: `apps/jev-keystroke-launcher-superpowers/src/ranker/score.ts`
- Create: `apps/jev-keystroke-launcher-superpowers/src/ranker/score.test.ts`

**Interfaces:**
- Consumes: `detectIntent`, `FIXTURE_ITEMS`, `NOW`, `WorkspaceItem`
- Produces: `rankWorkspace(query: string, items?: readonly WorkspaceItem[], now?: Date): RankedHit[]` — default `items` is `FIXTURE_ITEMS`, default `now` is `NOW`

- [ ] **Step 1: Write the failing test**

```ts
test("classic download query ranks q3-board-deck first", () => {
  const hits = rankWorkspace("the pdf I just downloaded");
  expect(hits[0].item.id).toBe("q3-board-deck");
  expect(hits[0].reasons).toContain("downloaded most recently");
  expect(hits).toHaveLength(16);
});

test("preset chips lock expected winners", () => {
  expect(rankWorkspace("waiting on legal to sign")[0].item.id).toBe("sow-legal-wait");
  expect(rankWorkspace("MSA countersign")[0].item.id).toBe("msa-northwind");
  expect(rankWorkspace("expired signature requests")[0].item.id).toBe("expired-nda");
});

test("MSA template does not outrank msa-northwind", () => {
  const hits = rankWorkspace("MSA countersign");
  const template = hits.find((h) => h.item.id === "msa-template")!;
  const msa = hits.find((h) => h.item.id === "msa-northwind")!;
  expect(msa.score).toBeGreaterThan(template.score);
});

test("whitespace-only query ranks all items by recency", () => {
  const hits = rankWorkspace("   ");
  expect(hits).toHaveLength(16);
  expect(hits[0].item.id).toBe("q3-board-deck");
  expect(hits[0].reasons).toContain("recent activity");
});

test("equal score and modifiedAt sorts by id ascending", () => {
  const now = NOW;
  const a = { ...FIXTURE_ITEMS[0], id: "b-id", title: "Zed", kind: "doc" as const, tags: [], modifiedAt: "2026-01-01T00:00:00.000Z", downloadedAt: undefined, signature: undefined, subtitle: "x" };
  const b = { ...a, id: "a-id", title: "Aye" };
  const hits = rankWorkspace("zzzz-no-match", [a, b], now);
  expect(hits.map((h) => h.item.id)).toEqual(["a-id", "b-id"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/jev-keystroke-launcher-superpowers && bun test src/ranker/score.test.ts`
Expected: FAIL (`rankWorkspace` not defined)

- [ ] **Step 3: Implement `rankWorkspace` in `src/ranker/score.ts`**

Apply spec scoring (lexical +8 / token ≥3, recency `max(0, 6 - ageDays/7)`, intent bonuses). Sort: score desc, `modifiedAt` desc, `id` asc. Always return all items. Reasons 1–3 unique, most specific first.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/jev-keystroke-launcher-superpowers && bun test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/jev-keystroke-launcher-superpowers/src/ranker/score.ts apps/jev-keystroke-launcher-superpowers/src/ranker/score.test.ts
git commit -m "feat: rank workspace items by intent"
```

---

### Task 4: Debounce helper

**Files:**
- Create: `apps/jev-keystroke-launcher-superpowers/src/lib/debounce.ts`
- Create: `apps/jev-keystroke-launcher-superpowers/src/lib/debounce.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `debounce<T extends (...args: never[]) => void>(fn: T, waitMs: number): ((...args: Parameters<T>) => void) & { cancel(): void }`

- [ ] **Step 1: Write the failing test**

Use `fake-timers` via `jest.useFakeTimers` if available, otherwise `mock.module` / manual clock: Bun’s `jest.useFakeTimers()` / `jest.advanceTimersByTime`. If Bun fake timers are awkward, test with a injected `clock: { setTimeout, clearTimeout }` — **do not**. Use:

```ts
test("invokes once after 100ms of silence", () => {
  jest.useFakeTimers();
  const fn = mock();
  const d = debounce(fn, 100);
  d();
  d();
  jest.advanceTimersByTime(99);
  expect(fn).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(fn).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});

test("cancel prevents a pending invocation", () => {
  jest.useFakeTimers();
  const fn = mock();
  const d = debounce(fn, 100);
  d();
  d.cancel();
  jest.advanceTimersByTime(200);
  expect(fn).not.toHaveBeenCalled();
  jest.useRealTimers();
});
```

If `jest` fake timers are unavailable in this Bun version, implement debounce with an optional third argument `timers = { setTimeout, clearTimeout }` **only if the first attempt errors**, and rewrite the test to inject fake timers. Ledger that ruling.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/jev-keystroke-launcher-superpowers && bun test src/lib/debounce.test.ts`
Expected: FAIL (`debounce` not defined)

- [ ] **Step 3: Implement `debounce` in `src/lib/debounce.ts`**

Trailing debounce only. `cancel` clears the timer.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/jev-keystroke-launcher-superpowers && bun test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/jev-keystroke-launcher-superpowers/src/lib
git commit -m "feat: add 100ms trailing debounce helper"
```

---

### Task 5: Jev probability mapper

**Files:**
- Create: `apps/jev-keystroke-launcher-superpowers/src/ranker/jev-map.ts`
- Create: `apps/jev-keystroke-launcher-superpowers/src/ranker/jev-map.test.ts`

**Interfaces:**
- Consumes: `WorkspaceItem`, `RankedHit`, `rankWorkspace`
- Produces: `mapJevProbabilities(items: readonly WorkspaceItem[], probabilities: Record<string, number>, fixtureHits: RankedHit[]): RankedHit[]`

- [ ] **Step 1: Write the failing test**

```ts
test("highest probability wins and unknown ids do not throw", () => {
  const fixtureHits = rankWorkspace("the pdf I just downloaded");
  const hits = mapJevProbabilities(
    FIXTURE_ITEMS,
    { "msa-northwind": 0.9, "ghost-id": 0.8 },
    fixtureHits,
  );
  expect(hits[0].item.id).toBe("msa-northwind");
  expect(hits).toHaveLength(16);
  expect(hits.find((h) => h.item.id === "q3-board-deck")!.score).toBe(0);
});
```

Score formula from spec: `round(p * 1000)` plus `+1` for the winner key (max probability among catalog ids). Missing catalog ids → 0. Reasons include `"Jev choice <id>"` on the winner and `"p=<n>"` with two decimal places for any id that had a probability.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/jev-keystroke-launcher-superpowers && bun test src/ranker/jev-map.test.ts`
Expected: FAIL (`mapJevProbabilities` not defined)

- [ ] **Step 3: Implement `mapJevProbabilities`**

Sort: Jev score desc, then fixture score desc, then id asc.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/jev-keystroke-launcher-superpowers && bun test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/jev-keystroke-launcher-superpowers/src/ranker/jev-map.ts apps/jev-keystroke-launcher-superpowers/src/ranker/jev-map.test.ts
git commit -m "feat: map Jev choice probabilities onto ranked hits"
```

---

### Task 6: Vite Jev proxy

**Files:**
- Create: `apps/jev-keystroke-launcher-superpowers/server/jev-proxy.ts`
- Create: `apps/jev-keystroke-launcher-superpowers/server/jev-proxy.test.ts`
- Modify: `apps/jev-keystroke-launcher-superpowers/vite.config.ts`
- Create: `apps/jev-keystroke-launcher-superpowers/src/api/rank-client.ts`

**Interfaces:**
- Consumes: `rankWorkspace`, `mapJevProbabilities`, `FIXTURE_ITEMS`
- Produces: `createJevProxyPlugin(): Plugin`; `fetchRankMode(): Promise<"fixture" | "live">`; `fetchRank(query: string): Promise<{ hits: RankedHit[]; mode: "fixture" | "live"; source: "jev" | "fixture"; note?: string }>`

- [ ] **Step 1: Write the failing test**

Test the **handler functions**, not a live HTTP server. Export `resolveRankMode(env: NodeJS.ProcessEnv): "fixture" | "live"` and `async function handleRank(query: string, env: NodeJS.ProcessEnv, fetchImpl: typeof fetch): Promise<RankResponse>`.

```ts
test("empty JEV_API_KEY is fixture mode and uses local ranker", async () => {
  expect(resolveRankMode({})).toBe("fixture");
  const res = await handleRank("the pdf I just downloaded", {}, fetch);
  expect(res.hits[0].item.id).toBe("q3-board-deck");
  expect(res.source).toBe("fixture");
});

test("live key posts to TypeSafe and maps probabilities", async () => {
  const fetchImpl = mock(async () =>
    new Response(JSON.stringify({
      answers: { best_item: { type: "choice", choice: "msa-northwind", probabilities: { "msa-northwind": 1 } } },
    }), { status: 200 }),
  ) as unknown as typeof fetch;
  const res = await handleRank("MSA countersign", { JEV_API_KEY: "test-key" }, fetchImpl);
  expect(res.source).toBe("jev");
  expect(res.hits[0].item.id).toBe("msa-northwind");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/jev-keystroke-launcher-superpowers && bun test server/jev-proxy.test.ts`
Expected: FAIL (handlers not defined)

- [ ] **Step 3: Implement handlers + Vite plugin + rank-client**

Plugin registers `GET /api/rank-mode` and `POST /api/rank`. Reads `JEV_API_KEY` from `process.env` only. Live fetch: 4000ms timeout, `Authorization: Bearer`, body per spec. HTTP/parse failure → fixture hits, `source: "fixture"`, `note: "Jev unreachable — fixture ranking"`. `resolveRankMode`: non-empty `JEV_API_KEY` → `"live"`. Client uses `fetch("/api/rank-mode")` and `fetch("/api/rank", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) })`. Empty/missing query on POST → 400 `{ error: "query required" }` (query may be `""` — empty string is allowed and ranks recency; **missing field** is 400). Ruling: `"query" in body` required, value may be `""`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/jev-keystroke-launcher-superpowers && bun test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/jev-keystroke-launcher-superpowers/server apps/jev-keystroke-launcher-superpowers/src/api apps/jev-keystroke-launcher-superpowers/vite.config.ts
git commit -m "feat: proxy optional live Jev ranking on the server"
```

---

### Task 7: Palette UI

**Files:**
- Create: `apps/jev-keystroke-launcher-superpowers/src/main.tsx`
- Create: `apps/jev-keystroke-launcher-superpowers/src/ui/App.tsx`
- Create: `apps/jev-keystroke-launcher-superpowers/src/ui/Palette.tsx`
- Create: `apps/jev-keystroke-launcher-superpowers/src/ui/style.css`
- Modify: `apps/jev-keystroke-launcher-superpowers/index.html`

**Interfaces:**
- Consumes: `rankWorkspace`, `debounce`, `PRESET_QUERIES`, `fetchRank`, `fetchRankMode`
- Produces: runnable UI on `:5173`

- [ ] **Step 1: Write the failing test**

Create `src/ui/selection.test.ts`:

```ts
test("isStaleEpoch rejects older request ids", () => {
  expect(isStaleEpoch(3, 4)).toBe(true);
  expect(isStaleEpoch(4, 4)).toBe(false);
});
```

`isStaleEpoch(received: number, latest: number): boolean` lives in `src/lib/request-epoch.ts`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/jev-keystroke-launcher-superpowers && bun test src/ui/selection.test.ts`
Expected: FAIL (`isStaleEpoch` not defined)

- [ ] **Step 3: Implement epoch helper + React palette**

Always-visible palette, Cmd/Ctrl+K focuses `#launcher-search`. Typing: `debounce(..., 100)`. Chips: immediate rank (no debounce). ↑/↓/Enter; highlight resets to 0 on new hits. Detail pane + Open → `Opened in mock viewer (no file)`. Badge from `fetchRankMode`. If mode is live, use `fetchRank`; ignore stale epochs. On live fetch failure, show the server `note` if present. Lumin-flavored ink + violet CSS. Title the page `Lumin · Intent launcher`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/jev-keystroke-launcher-superpowers && bun test`
Expected: PASS. Also run `bun run dev` long enough to confirm Vite starts (or `bunx vite --host 127.0.0.1 --port 5173` smoke).

- [ ] **Step 5: Commit**

```bash
git add apps/jev-keystroke-launcher-superpowers/src apps/jev-keystroke-launcher-superpowers/index.html
git commit -m "feat: add intent-ranked command palette UI"
```

---

### Task 8: README for reviewers

**Files:**
- Create: `apps/jev-keystroke-launcher-superpowers/README.md`

**Interfaces:**
- Consumes: acceptance criteria in `PLAN.md` and this spec
- Produces: reviewer-facing run + manual test notes

- [ ] **Step 1: Write the failing test**

`src/docs-readme.test.ts`:

```ts
test("README names Superpowers methodology and companion PR 9", async () => {
  const text = await Bun.file(new URL("../../README.md", import.meta.url)).text();
  expect(text).toContain("bun install && bun run dev");
  expect(text).toContain("obra/superpowers");
  expect(text).toContain("PR #9");
  expect(text).toContain("the pdf I just downloaded");
  expect(text).toContain("Fixture mode");
});
```

Adjust the `Bun.file` path so it resolves to `apps/jev-keystroke-launcher-superpowers/README.md`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/jev-keystroke-launcher-superpowers && bun test src/docs-readme.test.ts`
Expected: FAIL (README missing or missing phrases)

- [ ] **Step 3: Write README.md**

Must include: Superpowers chain (`using-superpowers` → brainstorming → writing-plans → TDD → executing-plans); quality twin of PR #9; do not duplicate bookmark tracking; run command; chip checklist with expected #1 titles; keyboard; badge; optional `JEV_API_KEY`; no `VITE_` key.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/jev-keystroke-launcher-superpowers && bun test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/jev-keystroke-launcher-superpowers/README.md apps/jev-keystroke-launcher-superpowers/src/docs-readme.test.ts
git commit -m "docs: add Superpowers twin README and manual test notes"
```
