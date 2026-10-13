# Lumin Sign fixture · e2e agent tests

Self-contained demo of [e2e](https://github.com/tester-army/e2e) by TesterArmy (Apache-2.0, npm `e2e`, pre-1.0) against a **fake Lumin Sign desk**. It is not the real Lumin Sign product and never talks to production APIs.

Plain-English `agent.act('sign the document')` steps sit next to Playwright-backed locators and `expect` assertions. Passing agent steps are recorded under `fixtures/e2e-cache/` and replayed with **zero model calls** until the UI changes.

Read [HOW_IT_WORKS.md](./HOW_IT_WORKS.md) for the record / replay / drift loop.

## Run

```bash
cd apps/e2e-esign-agent-tests
bun install
bun run dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/). Every script and the README commands set `E2E_TELEMETRY_DISABLED=1`.

## What to click / try

1. Confirm the amber banner: **Demo fixture only — not the real Lumin Sign product**.
2. On **Envelope**, click **Open envelope**. PDF.js should render the sample MSA.
3. Drag **Signature** onto the page (or click **Add signature field**).
4. Click **Send for signing**.
5. Type `Ada Lovelace`, click **Finish**. Status becomes **Awaiting countersignature**.
6. Click **Countersign as Bob Signer**, type `Bob Signer`, **Finish**. Status becomes **Completed**.
7. Toggle **Simulate UI drift**: buttons rename (`Finish` → `Apply signature`), the field panel moves left and is titled **Marks**, and the envelope **never** reaches Completed after both signatures.
8. Open **Results** for cold vs cached-replay duration and model-call counts.

## Tests (offline, no API key)

Committed replay caches and captured run JSON live in the repo. Default agent steps use a documented custom `StepExecutor` (no model).

```bash
E2E_TELEMETRY_DISABLED=1 bun run test:e2e
```

Useful variants:

```bash
# Locator-only + agent suite (expects cache hits)
E2E_TELEMETRY_DISABLED=1 bun run test:e2e

# Force a live plan (still no model; skips cache)
E2E_TELEMETRY_DISABLED=1 bun run test:e2e:cold

# Same envelope test against #drift (read-only cache so recordings stay stable)
E2E_TELEMETRY_DISABLED=1 bun run test:e2e:drift

# Re-capture public/fixtures/runs/*.json after a cache refresh
E2E_TELEMETRY_DISABLED=1 bun run capture-results

# The product assertion that Completed is expected — this fails on purpose
E2E_TELEMETRY_DISABLED=1 bun run test:bug
```

## Live agent (optional, env-gated)

Bring your own key. Nothing in this demo commits credentials.

```bash
export E2E_TELEMETRY_DISABLED=1
export E2E_LIVE_AGENT=1
export AI_GATEWAY_API_KEY="your-key"   # or use a Vercel OIDC token
bun add -d ai                          # once, if you have not already
bun run test:e2e:live
```

Without `E2E_LIVE_AGENT=1` **and** a key, the built-in model loop is not configured.

## Manual test checklist

- [ ] `bun install && bun run dev` serves `http://127.0.0.1:5173/`
- [ ] Banner still says this is a fixture (not the real Lumin app)
- [ ] PDF.js renders `public/contract.pdf` on Prepare
- [ ] Drag/drop **or** **Add signature field** places a field on the page
- [ ] Ada signs → Awaiting countersignature; Bob countersigns → **Completed**
- [ ] Drift toggle renames buttons and moves the field panel
- [ ] After both signatures under drift, status stays **Awaiting countersignature**
- [ ] `/results` shows cold vs replay duration and model-call counts
- [ ] `bun run test:e2e` passes with no API key (cache replay)
- [ ] `E2E_TELEMETRY_DISABLED=1` is set in scripts and docs

## Notes for reviewers

- No WebMCP flag. There is no in-page LLM panel; the e2e runner **is** the agent.
- Session-only envelope state. **Reset demo** or a new tab clears it.
- Replay cache directory is `fixtures/e2e-cache/` (committed on purpose).
- Captured reports: `public/fixtures/runs/{cold,replay,drift,bug}.json`.
