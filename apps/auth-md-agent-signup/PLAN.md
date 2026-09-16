# auth.md agent signup playground

## Source
- Bookmark: https://x.com/grinich/status/2098125592352931866
- Docs: https://workos.com/auth-md
- Inspired by: [Claimable Neon](https://neon.com/claimable-neon) (anonymous provision, human claim later)
- Slug: `auth-md-agent-signup`

## Goal (single-user MVP)
In under two minutes, a reviewer can watch a **mock agent** discover Harbor Notes via `/auth.md`, register (anonymous or `service_auth`), request scopes, and wait for credentials — while a **human claim desk** (Claimable Neon–style) approves the pending request with a 6-digit `user_code`. Status of pending/claimed agents and demo-safe fake tokens is visible the whole time. No real WorkOS or Neon APIs.

## Out of scope
- Real WorkOS AuthKit / Neon Claimable production APIs
- `identity_assertion` / ID-JAG (needs a trusted identity provider)
- Production auth (JWT signatures, PKCE, TLS, persistence)
- Multi-tenant storage, expiry enforcement beyond in-memory demo windows
- Cloudflare or other deploy wiring
- WebMCP / in-browser LLM agent

## Stack
- Runtime/tooling: Bun (`Bun.serve`)
- UI/framework: static HTML + CSS + vanilla JS (no SPA framework)
- Key libraries: none — protocol mock is in-process and in-memory

## Manual testing / README
What `apps/auth-md-agent-signup/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`)
- Open `http://localhost:5173/`
- What to click: Discover → Register anonymously → start claim → copy code → approve on the claim desk → see post-claim token and a successful write
- No WebMCP flags; Agent panel N/A
- Pass/fail checklist for discovery doc, mock agent steps, human approve, and credential status

## Acceptance criteria
- [ ] `cd apps/auth-md-agent-signup && bun install && bun run dev` works
- [ ] `apps/auth-md-agent-signup/README.md` is present with run steps and a manual test checklist
- [ ] Demo PR includes at least one screenshot of the running app
- [ ] Demo PR includes at least one video of the running app
- [ ] `GET /auth.md` is a protocol-shaped discovery doc (discover → method → register → claim → token)
- [ ] Mock agent can register, request scopes, and receive in-memory fake credentials
- [ ] Human claim/approve UI completes the RFC 8628-shaped ceremony (`user_code` + verification URI)
- [ ] Status board shows pending vs claimed agents and issued demo tokens
- [ ] No calls to WorkOS or Neon production APIs

## Validation (PR)
- Screenshot: Full three-pane layout after a claimed anonymous agent, with user_code, approved badge, and issued `at_demo_…` token
- Video: Open app → Discover/Register anonymous → fail a write (pre-claim) → start claim → approve on the human desk → poll succeeds → write works
- README: Confirm run steps + manual test notes match the checklist above
