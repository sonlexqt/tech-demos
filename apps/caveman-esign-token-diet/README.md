# Caveman × Lumin Sign token diet

Replay the same **Lumin Sign ops-agent** questions four ways and see where tokens actually go.

This is a demo of [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) (Apache-2.0): an agent **output skill** (short blunt answers; IDs and errors stay verbatim) plus a newer **local proxy** that shrinks what the agent reads. The app does **not** ship the real proxy. It uses a small demo compressor and fixture replies so a reviewer can compare diets offline.

Numbers on screen are a **local token estimator** and an **illustrative** $3 / $15 per 1M-token cost. They are not provider billing and not Caveman's published CaveBench figure. See [HOW_IT_WORKS.md](./HOW_IT_WORKS.md).

## Run

```bash
cd apps/caveman-esign-token-diet
bun install
bun run dev
```

Open [http://localhost:5173/](http://localhost:5173/).

No WebMCP flag. No in-page Agent panel. The replay engine *is* the agent.

Optional live model (never required, never commit a key):

```bash
cp .env.example .env
# set ANTHROPIC_API_KEY or OPENAI_API_KEY
bun run dev
```

The header shows **Offline fixtures** unless a key is present. Tick **Use live model** only after that.

## What to click / try

1. The first task (**Why did the signer decline the MSA?**) runs all four modes on load.
2. Read **Token + cost comparison**. Normal is the baseline. Caveman-only often saves output but *adds* skill tokens on input. Proxy-trimmed input is the large cut. Both stacks the two.
3. Check **Fact survival**. Signer names, envelope IDs, and the decline reason should stay **kept** in every diet.
4. Compare **Normal reply** vs the selected diet. Open **Response diff**.
5. In **What the model reads**, flip **Raw dump** → **Proxy-trimmed**. Retries, HMAC, JA3, edge-pop, and health lines should disappear; `ENV-MSA-7F2C91`, `Priya Raman`, and clause 8.4 should remain.
6. Switch the diet chips: Normal, Caveman output, Proxy input, Both.
7. Run the other two tasks: **Summarize this audit trail** and **Plan reminders for the stalled envelopes**.

## Manual test checklist

- [ ] `bun install && bun run dev` serves `http://localhost:5173/`
- [ ] Header says **Offline fixtures** when no key is set
- [ ] Honest-numbers copy does **not** treat 33% as a guaranteed saving
- [ ] Task 1 auto-replays four modes and fills the token table
- [ ] Caveman output token count is lower than Normal
- [ ] Proxy (and Both) input token count is lower than Normal
- [ ] Fact badges for Priya Raman, `ENV-MSA-7F2C91`, and clause 8.4 are **kept**
- [ ] Diff highlights fluff removed from the Caveman reply
- [ ] Proxy-trimmed dump is smaller and still contains the envelope ID
- [ ] Tasks 2 and 3 replay and keep their signer / envelope facts
- [ ] `bun test` passes
- [ ] Links in the footer go to the real Caveman skill, proxy section, and HONEST-NUMBERS.md

## Notes for reviewers

- Fixtures are Lumin Sign-**shaped** (event types, `signature_request_id`, `REJECTED`) plus an ops `envelope_id`. They are not live workspace data.
- Real Caveman: [skill](https://github.com/JuliusBrussee/caveman/blob/main/skills/caveman/SKILL.md) · [proxy](https://github.com/JuliusBrussee/caveman#big-rock-the-proxy) · [honest numbers](https://github.com/JuliusBrussee/caveman/blob/main/docs/HONEST-NUMBERS.md)
- Source bookmark: [item #5, Top 10 OpenCode Skill Repos](https://x.com/neerajjj6785/status/2104895659157684597)
