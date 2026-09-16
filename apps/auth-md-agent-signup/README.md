# Harbor Notes · auth.md playground

Self-contained demo of the [WorkOS auth.md](https://workos.com/auth-md) protocol shape: an agent discovers how to register, requests scopes, and receives **user-scoped credentials** after a human claim. **No production identity APIs.**

## Run

```bash
cd apps/auth-md-agent-signup
bun install
bun run dev
```

Open [http://localhost:5173/](http://localhost:5173/). The server is `Bun.serve` (API + static UI). Discovery lives at [http://localhost:5173/auth.md](http://localhost:5173/auth.md).

There is no WebMCP flag and no in-page LLM Agent panel. The **Mock agent** column *is* the agent: it issues the same HTTP calls a real agent would after reading `auth.md`.

## What to click / try

1. Leave **anonymous** selected.
2. On the **Human claim desk**, set **Signed in as** to any email (default `ada@harbor.local`, or your own such as `son@luminpdf.com`). Play through claim binds the ceremony to that address. You can also type it in **Login hint / claim email** — the two fields stay in sync when you start the flow.
3. Click **Play through claim**. The agent fetches `/auth.md` + well-known metadata, registers, exchanges a pre-claim `at_demo_…` token, **GET**s notes, then **POST**s a note (this should **fail** with `insufficient_scope` until you claim).
4. A 6-digit **user_code** appears. Type that code on the claim desk and **Approve & claim** while Signed in as matches the bound email. If they differ, click **Sign in as this email** (fills the field) or **Bind claim to signed-in email** (changes the binding).
5. The mock agent is already polling. After approve it should receive post-claim scopes (`notes.read notes.write`) and the POST note should succeed.
6. Confirm **Status**: registration badge `claimed`, a revoked pre-claim token, a live post-claim token, and a note.

Optional: switch the method to **service_auth**, reset, and repeat. There is no token until the claim desk approves.

## Manual test checklist

- [ ] `bun install && bun run dev` serves `http://localhost:5173/`
- [ ] `GET /auth.md` is markdown describing discover → register → claim → token exchange
- [ ] UI and live `/auth.md` stay on the auth.md / WorkOS protocol framing
- [ ] `GET /.well-known/oauth-protected-resource` lists `notes.read` / `notes.write`
- [ ] Anonymous register returns `identity_assertion` + `claim_token` + split pre/post scopes
- [ ] Pre-claim `POST /api/notes` returns `insufficient_scope`
- [ ] Claim desk **Signed in as** is an editable email, not a fixed dropdown
- [ ] Custom email (e.g. `son@luminpdf.com`) in Signed in as + Play through claim + matching Approve succeeds
- [ ] Mismatch (bound email ≠ Signed in as) shows a clear error and **Sign in as this email** fixes it
- [ ] Claim desk rejects a wrong 6-digit code
- [ ] Correct code + Approve moves the registration to `claimed`
- [ ] Claim-grant poll (or **7. Poll token**) returns `at_demo_…` with `notes.write`
- [ ] Post-claim `POST /api/notes` creates a note visible in Status
- [ ] **Reset demo** clears in-memory registrations, tokens, and notes
- [ ] Banner still says this is a mock (no production APIs)

## Notes for reviewers

- [Owner research notes (PDF)](./owner-findings.pdf)
- Tokens are obviously fake (`at_demo_…`, `demo-jag.…unsigned`) and never leave this process.
- In-memory only: restarting the server wipes state.
- `identity_assertion` / ID-JAG is intentionally unimplemented (would need a trusted provider).
