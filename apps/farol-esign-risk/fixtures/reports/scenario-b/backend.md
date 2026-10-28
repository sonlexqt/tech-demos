<!-- farol -->
### farol · merge risk 66/100 (high) · ⚠ careful review

Most of the risk comes from `serialize.ts`, used by 4 of 9 existing operations and `schema.graphql`, used by 3 of 9 existing operations. 3 code files changed; 7 of 9 existing operations run changed code.

<sub>farol only informs: it never approves or blocks.</sub>

**Must check** (by hand, before approving)
- [ ] Breaking API change: `Mutation.signEnvelope`, `Query.envelope`, `Query.envelopes` — **30**

**Files by risk** (points are each part's share of the 66)
- 🔴 `server/serialize.ts` **19** · 4 of 9 operations
- 🔴 `server/schema.graphql` **14** · 3 of 9 operations
- 🟠 `src/hooks/signatureStatus.ts` **3**

<details>
<summary>All signals</summary>

- **Why this review:** merge risk score 66/100; 3 endpoint(s) with breaking contract changes: Mutation.signEnvelope, Query.envelope, Query.envelopes (check that clients are updated); existing code changed: 7 existing operation(s) run it; diff coverage not verified: risk is counted as if nothing were tested
- **Contracts:** 3 endpoints with breaking changes (3 endpoint contracts read)
  - 🔴 `Mutation.signEnvelope`: `Envelope.status` Envelope.status was removed. — callers unknown (no usage report)
  - 🔴 `Query.envelope`: `Envelope.status` Envelope.status was removed. — callers unknown (no usage report)
  - 🔴 `Query.envelopes`: `Envelope.status` Envelope.status was removed. — callers unknown (no usage report)
- **Risk:** 0 high, 2 medium, 1 low
  - 🟠 `server/serialize.ts` 4/9 operations, 2 dependents
  - 🟠 `server/schema.graphql` 3/9 operations, 0 dependents
- **Vulnerabilities in added or changed dependencies:** not verified
- **Diff coverage:** not verified
- **Lint on changed lines:** not verified
- **Added suppressions:** none
- **Modified existing tests:** none

</details>

<details>
<summary>Classification — open only after reviewing</summary>

**Class:** `touches-existing` — touches existing code

**Reasons:**
- existing schema changed (`schema-not-additive`) `server/schema.graphql`: schema member Envelope.status was removed
- existing file modified (`existing-file-modified`) `server/serialize.ts`: reached by 4 existing route(s): GET /api/envelopes via server/serialize.ts; GET /api/envelopes/:id via server/serialize.ts; POST /api/envelopes/:id/sign via server/serialize.ts; and 1 more
- existing file modified, no route reaches it (`existing-file-unreachable`) `src/hooks/signatureStatus.ts`: modified, and no route reaches it

**New routes:** none

**Affected existing routes:**
- `GET /api/envelopes` via `server/serialize.ts`
- `GET /api/envelopes/:id` via `server/serialize.ts`
- `Mutation.signEnvelope` via `server/schema.graphql`
- `POST /api/envelopes/:id/sign` via `server/serialize.ts`
- `POST /api/reset` via `server/serialize.ts`
- `Query.envelope` via `server/schema.graphql`
- `Query.envelopes` via `server/schema.graphql`

**Was the classification right? Tick one option:**
- [ ] I agree with the classification
- [ ] I disagree: the PR changed existing behavior
- [ ] I disagree: the PR was isolated and farol missed it

</details>

<details>
<summary>Manual test checklist (7)</summary>

- [ ] `GET /api/envelopes` (via serialize.ts)
- [ ] `GET /api/envelopes/:id` (via serialize.ts)
- [ ] `POST /api/envelopes/:id/sign` (via serialize.ts)
- [ ] `POST /api/reset` (via serialize.ts)
- [ ] `Mutation.signEnvelope` (via schema.graphql)
- [ ] `Query.envelope` (via schema.graphql)
- [ ] `Query.envelopes` (via schema.graphql)

</details>

<sub>farol 0.2.1 · analyzed commit 84219672adb4 · shadow mode</sub>
