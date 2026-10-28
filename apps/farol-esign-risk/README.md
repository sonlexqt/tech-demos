# Farol e-sign risk (Lumin Sign fixture)

Local **Lumin Sign–shaped** envelope fixture that demonstrates [farol](https://github.com/winnin/farol) (`@winninjs/farol`, MIT): deterministic PR risk from the TypeScript compiler — not an LLM. Reviewers click through list → review & sign → countersign → audit trail, then contrast two committed farol scenarios.

No Lumin production APIs or credentials. Everything is in-memory on this machine.

## Run

```bash
cd apps/farol-esign-risk
bun install
bun run dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/). The UI is Vite; `/api/*` proxies to a tiny Express API on `:8787`.

No WebMCP flags. No Agent panel.

## What to click

1. **Envelopes** — four local envelopes. The heading `Recieved for signature` is a planted typo used by scenario A.
2. Open **Mutual NDA — Harbor × Finch**. Sam already signed; Priya is waiting to countersign.
3. **Review & sign** — first-party pad. Shared hook `useSignatureStatus` (via `deriveSignatureStatus`) decides whether the pad is open.
4. **Countersign** — same hook, `role: "countersigner"`. Apply Priya’s signature.
5. **Audit trail** — created / sent / signed / countersigned events.
6. Try the offer letter (Maya has not signed yet) and the completed / voided envelopes.
7. **Farol scenarios** in the nav, or [http://127.0.0.1:5173/farol](http://127.0.0.1:5173/farol), for links to the committed HTML reports.
8. **Reset fixture** on the list page restores seed data.

## Two farol scenarios

`bun run farol:scenarios` copies the app into a throwaway git repo, applies each overlay, and runs `npx @winninjs/farol`. Reports are written to `fixtures/reports/` and copied to `public/farol-reports/` so the running app can open them.

| Scenario | Diff | Overlay | Reports |
|---|---|---|---|
| **A — Harmless** | `Recieved` → `Received` on the list page only | `scenarios/A-harmless/` | `fixtures/reports/scenario-a/frontend.*` |
| **B — Quiet blast radius** | One-line change to `deriveSignatureStatus` (the helper behind `useSignatureStatus`) **and** `Envelope.status` → `envelopeStatus` in GraphQL + REST serializer | `scenarios/B-blast-radius/` | `fixtures/reports/scenario-b/frontend.*` and `backend.*` |

Regenerate:

```bash
bun run farol:scenarios
```

Needs network the first time (`npx @winninjs/farol`). Also: `bun run farol:routes` to print the pages and API operations farol sees on this tree.

### How to read the committed reports

Open the HTML files in a browser (or via `/farol` while the app is running):

- Verdict and 0–100 score
- **Start here** / reach: which pages run the changed declarations, with call chains
- Backend report: contract changes (GraphQL field rename)
- Coverage: scenario B frontend is analyzed with a Vitest Istanbul report; the hook helper is not tested

### Recorded CLI output (`@winninjs/farol` 0.2.1)

These are the committed reports, not an imagined glow-up:

| Run | Score | Verdict | Reach / contracts |
|---|---|---|---|
| **A frontend** | 16/100 (low) | ◐ quick review | Only `/` via `EnvelopeList`. No countersign. No contract. farol will not *fast track* an existing page function, even for a typo. |
| **B frontend** | 30/100 (medium) | ◐ quick review | `/envelopes/:id` and `/envelopes/:id/countersign` via `ReviewSign` → `useSignatureStatus` → `deriveSignatureStatus`. Changed line 70 **0% covered**. |
| **B backend** | 66/100 (high) | ⚠ careful review | Breaking: `Envelope.status` removed on `Query.envelopes`, `Query.envelope`, `Mutation.signEnvelope`. |

Together, B is the careful-review + blast-radius + contract-break story: the frontend report shows *where* the one-liner lives; the backend report flips the verdict.

## Manual test checklist

- [ ] `bun install && bun run dev` serves the UI on `:5173` and `GET /api/health` is ok
- [ ] Envelope list shows four rows; NDA waiting on Priya (countersigner)
- [ ] Review & sign on the offer letter lets Maya sign; countersign stays blocked until the first party signs
- [ ] Countersign on the NDA lets Priya sign; status becomes completed; audit lists countersigned
- [ ] Completed MSA and voided SOW do not open the pad
- [ ] Reset fixture restores the seed
- [ ] `/farol` explains A vs B and links the committed reports
- [ ] `bun run farol:scenarios` reproduces JSON/Markdown/HTML under `fixtures/reports/`
- [ ] Scenario A is low-score, list page only — no countersign reach, no contract break
- [ ] Scenario B frontend reach includes `/envelopes/:id/countersign` (recorded: yes, plus review)
- [ ] Scenario B backend flags `Envelope.status` removed (recorded: careful review, 66/100)

## Layout

- `src/pages/` — list, review & sign, countersign, audit, farol notes
- `src/hooks/useSignatureStatus.ts` — shared hook used by review **and** countersign
- `server/` — Express REST + `schema.graphql` contract
- `scenarios/` — overlays applied only by the farol script
- `HOW_IT_WORKS.md` — compiler-based risk + how this fixture shows blast radius
