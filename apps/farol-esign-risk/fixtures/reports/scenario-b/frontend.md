<!-- farol -->
### farol · merge risk 30/100 (medium) · ◐ quick review

Most of the risk comes from `signatureStatus.ts`, used by 2 of 5 existing pages and `schema.graphql`, nothing imports it. 3 code files changed; 2 of 5 existing pages run changed code.

<sub>farol only informs: it never approves or blocks.</sub>

**Files by risk** (points are each part's share of the 30)
- 🔴 `src/hooks/signatureStatus.ts` **26** · 0% of changed lines covered · 2 of 5 pages
- and 2 files to skim: 4 points together

**New code tested:** 0% (0 of 1 changed lines) · 1 file left out of coverage on purpose

<details>
<summary>All signals</summary>

- **Why this review:** merge risk score 30/100; existing code changed: 2 existing page(s) run it; diff coverage 0%
- **Risk:** 0 high, 1 medium, 2 low
  - 🟠 `src/hooks/signatureStatus.ts` 2/5 pages, 6 dependents
- **Vulnerabilities in added or changed dependencies:** not verified
- **Diff coverage:** 0.0% (0 of 1 changed executable lines covered) — uncovered ranges:
  - `src/hooks/signatureStatus.ts`: 70
- **Lint on changed lines:** not verified
- **Added suppressions:** none
- **Modified existing tests:** none

</details>

<details>
<summary>Classification — open only after reviewing</summary>

**Class:** `touches-existing` — touches existing code

**Reasons:**
- existing file modified (`existing-file-modified`) `src/hooks/signatureStatus.ts`: func src/hooks/signatureStatus.ts#deriveSignatureStatus changed: reached by 2 existing route(s): / &gt; envelopes/:id; / &gt; envelopes/:id/countersign
- existing file modified, no route reaches it (`existing-file-unreachable`) `server/schema.graphql`: modified, and it is not part of the import graph
- existing file modified, no route reaches it (`existing-file-unreachable`) `server/serialize.ts`: func server/serialize.ts#toApiEnvelope changed; func server/serialize.ts#toApiSummary changed; no route reaches it

**New routes:** none

**Affected existing routes:**
- `/envelopes/:id` (`/ > envelopes/:id`) via `src/pages/ReviewSign.tsx` → `src/hooks/useSignatureStatus.ts` → `src/hooks/signatureStatus.ts`
- `/envelopes/:id/countersign` (`/ > envelopes/:id/countersign`) via `src/pages/Countersign.tsx` → `src/hooks/useSignatureStatus.ts` → `src/hooks/signatureStatus.ts`

**Was the classification right? Tick one option:**
- [ ] I agree with the classification
- [ ] I disagree: the PR changed existing behavior
- [ ] I disagree: the PR was isolated and farol missed it

</details>

<details>
<summary>Manual test checklist (2)</summary>

- [ ] `/envelopes/:id` (via signatureStatus.ts)
- [ ] `/envelopes/:id/countersign` (via signatureStatus.ts)

</details>

<sub>farol 0.2.1 · analyzed commit 84219672adb4 · shadow mode</sub>
