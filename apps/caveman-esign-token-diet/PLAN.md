# Caveman e-sign token diet

## Source
- Bookmark: https://x.com/neerajjj6785/status/2104895659157684597 (item #5, Top 10 OpenCode Skill Repos)
- Upstream: https://github.com/JuliusBrussee/caveman (Apache-2.0)
- Slug: `caveman-esign-token-diet`

## Goal (single-user MVP)
In under two minutes, a reviewer replays the same Lumin Sign ops-agent questions **four ways** — normal, Caveman short output, proxy-trimmed input, both — against fixture audit trails and webhook dumps. Each run shows input/output token counts, an estimated cost, a side-by-side response diff, and a **fact-survival** check (signer names, envelope ID, decline reason) so it is obvious what trimming kept. Offline and deterministic by default; an optional live LLM key is documented, never committed. The UI states author claims and the skeptic case honestly and does not treat unverified percentages as fact.

## Out of scope
- Shipping or wrapping the real Caveman Go proxy / CLI
- Production Lumin Sign APIs, auth, or live webhook ingestion
- Multi-user, persistence, deploy
- Claiming the author's ~33% CaveBench input reduction (or the older 65% output figure) as independently verified
- WebMCP / in-page Agent panel

## Stack
- Runtime/tooling: Bun (`Bun.serve` + `bun test`)
- UI/framework: static HTML + CSS + vanilla JS
- Key libraries: none required. Optional live path uses `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` if present in the environment.

## Manual testing / README
What `apps/caveman-esign-token-diet/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`) and open `http://localhost:5173/`
- What to click: pick each of the three tasks; run all four modes; read token/cost bars; inspect raw vs trimmed input; confirm fact-survival badges; compare Normal vs Caveman text
- No WebMCP flags; no Agent panel
- Offline is the default; optional env keys for a live model
- Links to the real [Caveman skill](https://github.com/JuliusBrussee/caveman/blob/main/skills/caveman/SKILL.md) and [proxy](https://github.com/JuliusBrussee/caveman#big-rock-the-proxy)
- Pass/fail checklist for the comparison flow

## Acceptance criteria
- [ ] `cd apps/caveman-esign-token-diet && bun install && bun run dev` works
- [ ] `apps/caveman-esign-token-diet/README.md` has run steps and a manual test checklist
- [ ] `apps/caveman-esign-token-diet/HOW_IT_WORKS.md` explains the agent token loop, output skill vs input proxy, and how this demo maps (with mermaid)
- [ ] Demo PR includes at least one screenshot and one video of the running app
- [ ] Three fixture tasks: decline reason, audit-trail summary, stalled-envelope reminders
- [ ] Four modes per task: normal / caveman / proxy / both
- [ ] Each run reports input tokens, output tokens, and estimated cost
- [ ] Side-by-side response diff is visible
- [ ] Fact-survival check covers signer names, envelope ID, and decline reason (where the task has one)
- [ ] Default path is offline + deterministic; live key is optional and not committed
- [ ] Copy presents author claims and the “agents read 5–10× more than they write” skeptic case without treating unverified numbers as fact
- [ ] `tracking/seen-bookmarks.json` adds id `2104895659157684597-caveman` under both `proposed` and `built` without wiping existing rows

## Validation (PR)
- Screenshot: Comparison view after a task with all four modes, token/cost numbers, fact-survival pass, and raw vs trimmed input visible
- Video: Open app → task 1 all modes (tokens + facts + diff) → task 2 → task 3; show proxy input shrink and Caveman output shrink
- README: Confirm run steps + manual test notes match the checklist above
