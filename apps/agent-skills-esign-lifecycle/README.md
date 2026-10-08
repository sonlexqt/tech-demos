# Lumin Sign · Agent Skills lifecycle

Offline demo of [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills): one **Lumin Sign** ticket walks Define → Plan → Build → Verify → Review → Ship. Each stage shows the artifact the skill produces. A **rationalization catcher** blocks the usual shortcuts. Compare is a fixture-only contrast with the Superpowers twin on [PR #10](https://github.com/sonlexqt/tech-demos/pull/10).

This page does **not** install the plugin or run a live coding agent. No API keys.

## Run

```bash
cd apps/agent-skills-esign-lifecycle
bun install
bun run dev
```

Open [http://localhost:5173/](http://localhost:5173/).

There is no WebMCP flag and no in-page Agent panel. The timeline *is* the replay: fixtures stand in for `/spec` `/plan` `/build` `/test` `/review` `/ship`.

## What to click / try

1. Stay on **Lifecycle**. The ticket is **SIGN-1847** — configurable signer reminder cadence.
2. Click each stage (or **Next stage**):
   - **Define** — parchment `SPEC.md` cards (six core areas + assumptions).
   - **Plan** — T1–T4 with acceptance criteria, verify commands, checkpoints.
   - **Build** — four thin-slice commits.
   - **Verify** — RED → GREEN → REFACTOR log. The signed-envelope test fails first.
   - **Review** — five-axis scorecard. Switch **Staff / QA / Security / Web performance**. Comments are tagged **Required / Nit / Optional / FYI**.
   - **Ship** — checklist plus a rollback plan (flag kill switch, replay, times).
3. On any stage, use the **Rationalization catcher**. Click “I’ll add tests later”, “Too small for a spec”, or “We don’t need a feature flag”. Each attempt is **Blocked** with the skill’s rebuttal and required evidence.
4. Open **Compare**. Read the brief, fair Superpowers twin table. It does not load the other app.

## Manual test checklist

- [ ] `bun install && bun run dev` serves `http://localhost:5173/`
- [ ] Header shows SIGN-1847, Fixture mode, and the upstream pack name
- [ ] All six timeline stages are clickable and show a distinct artifact
- [ ] Define shows Objective / Commands / Structure / Style / Testing / Boundaries
- [ ] Plan tasks each have acceptance criteria and a verify command
- [ ] Verify log has a **FAIL** then **PASS**
- [ ] Review persona tabs filter comments; at least one **Nit**, **Optional**, and **FYI**
- [ ] Ship shows a rollback plan with trigger conditions and flag lifecycle
- [ ] Catcher blocks ≥3 shortcuts; blocked cards name the skill and list evidence
- [ ] Compare tab mentions PR #10, does not claim a winner, and stays fixture-only
- [ ] No API key or env file is required
- [ ] Banner / copy still says this is a fixture replay (not a live agent)

## Notes for reviewers

- Concepts and mermaid maps: [HOW_IT_WORKS.md](./HOW_IT_WORKS.md)
- Plan: [PLAN.md](./PLAN.md)
- Upstream: [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) (MIT)
- `/ship` fans out staff + QA + security. `/webperf` is the dedicated web-performance persona (not in the `/ship` fan-out) — the Review tab still lets you open it.
- Source bookmark: https://x.com/neerajjj6785/status/2104895659157684597 (item #6)
