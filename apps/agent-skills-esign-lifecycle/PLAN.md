# Agent Skills · Lumin Sign ticket lifecycle

## Source
- Bookmark: https://x.com/neerajjj6785/status/2104895659157684597 (item #6, Top 10 OpenCode Skill Repos)
- Upstream: https://github.com/addyosmani/agent-skills (MIT)
- Slug: `agent-skills-esign-lifecycle`

## Goal (single-user MVP)
In under two minutes a reviewer walks one **Lumin Sign** ticket — *configurable signer reminder cadence on signature requests* — through Addy Osmani's six lifecycle stages (Define → Plan → Build → Verify → Review → Ship). Each stage shows the artifact the matching skill/command produces (`SPEC.md`, task breakdown with acceptance criteria, incremental build slices, test-first red→green log, five-axis review with Nit / Optional / FYI plus four persona views, ship checklist with rollback). A **rationalization catcher** lets the agent try shortcuts; the skill blocks each with its rebuttal and required evidence. An optional Compare tab contrasts this pack with the Superpowers twin from [PR #10](https://github.com/sonlexqt/tech-demos/pull/10) using fixtures only. Offline fixtures; no keys.

## Out of scope
- Installing or invoking the real `addyosmani/agent-skills` plugin in-page
- Live Claude Code / OpenCode / Cursor skill sessions
- Production e-sign (certificates, legal signature validity, persistence, mail delivery)
- Auth, multi-user, deploy
- Live calls to the Superpowers twin app (fixtures + documented comparison only)
- `/build auto`, `/constraints`, `/code-simplify`, `/webperf` as full interactive workflows (they are named; `/webperf` appears as the web-performance persona)

## Stack
- Runtime/tooling: Bun
- UI/framework: Vite + TypeScript (vanilla DOM)
- Key libraries: Vite + TypeScript only. No API keys.

## Ticket (fixture)
**SIGN-1847** — Configurable signer reminder cadence on signature requests.

Workspace admins pick first-reminder delay, repeat interval, and max reminders (presets 24h / 48h / 72h or custom hours). Reminders stop after signed, declined, expired, or voided. Reuses the existing `scheduleReminders` helper.

## Surfaces
| Surface | Upstream mapping |
| --- | --- |
| Timeline stages | `/spec` `/plan` `/build` `/test` `/review` `/ship` |
| SPEC.md | `spec-driven-development` six core areas |
| Task list | `planning-and-task-breakdown` vertical slices + AC |
| Build log | `incremental-implementation` thin slices + commits |
| Red→green log | `test-driven-development` Prove-It / RED-GREEN-REFACTOR |
| Five-axis review | `code-review-and-quality` + personas (`code-reviewer`, `test-engineer`, `security-auditor`, `web-performance-auditor`) |
| Ship + rollback | `shipping-and-launch` pre-launch + rollback plan |
| Rationalization catcher | Common Rationalizations tables + Verification evidence |
| Compare tab | `docs/comparison.md` vs obra/superpowers as used on PR #10 |

## Manual testing / README
What `apps/agent-skills-esign-lifecycle/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`)
- Open `http://localhost:5173/`
- Walk all six timeline stages; confirm each artifact
- Open Rationalization catcher; try at least three shortcuts; each is blocked with rebuttal + required evidence
- On Review, switch persona views and see Nit / Optional / FYI tags
- On Ship, read the rollback plan
- Open Compare; read the Superpowers twin contrast (fixtures only)
- No WebMCP flag; no in-page Agent panel
- Link to https://github.com/addyosmani/agent-skills
- Pass/fail checklist for stages, catcher, personas, compare, offline default

## Acceptance criteria
- [ ] `cd apps/agent-skills-esign-lifecycle && bun install && bun run dev` works
- [ ] `apps/agent-skills-esign-lifecycle/README.md` has run steps and a manual test checklist
- [ ] `apps/agent-skills-esign-lifecycle/HOW_IT_WORKS.md` explains lifecycle stages, the anti-rationalization gate, and how this demo maps (with mermaid)
- [ ] Demo PR includes at least one screenshot of the running app
- [ ] Demo PR includes at least one video (walk timeline stages + rationalization catcher)
- [ ] Six stages, each with the artifact listed above
- [ ] Rationalization catcher blocks shortcuts with rebuttal + required evidence
- [ ] Review comments are tagged Nit / Optional / FYI (plus Critical / Required) and filter by persona
- [ ] Ship stage includes a rollback plan
- [ ] Compare tab is brief, fair, and fixture-only vs PR #10 Superpowers twin
- [ ] Offline fixtures; no keys required
- [ ] `tracking/seen-bookmarks.json` adds `2104895659157684597-agent-skills` under proposed and built without wiping existing rows

## Validation (PR)
- Screenshot: Review or Define stage with the timeline, artifact, and rationalization catcher visible
- Video: Open app → walk Define through Ship → trigger several catcher blocks → open Compare
- README: Confirm run steps + manual test notes match the checklist above
