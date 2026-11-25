# PenGPT Signature Lab

## Source
- Bookmark: https://github.com/greydanus/pengpt
- Slug: `pengpt-signature-lab`

## Goal (single-user MVP)
In under two minutes a reviewer can open a draw-to-sign pad, replay a fixture stroke file at real pen speed, run a blind real-vs-generated comparison for a volunteer, and read a stroke-forensics score that says how “human” the telemetry looks. The demo measures how cheap it is to fake a **drawn** signature stroke-by-stroke with PenGPT (~6M, numpy) and whether timing/kinematics catch it — so Lumin Sign can judge how much weight an audit trail should put on pad telemetry versus identity proof (Lumin ID).

## Out of scope
- Real customer signatures or production Lumin APIs
- Cloudflare Pages / any public deploy (local-only; drawn signatures must not be hosted)
- Training or fine-tuning PenGPT
- A production classifier, server, or rater accounts
- Photo→style fitting in CI (needs torch, InkSight, `ANTHROPIC_API_KEY`; documented for laptops)

## Stack
- Runtime/tooling: Bun (app + tests); Python 3 + numpy (optional local PenGPT generation)
- UI/framework: Vite + TypeScript (vanilla DOM, canvas pad)
- Key libraries: `pdf-lib` (bonus: generated handwriting as a PDF annotation)

## Manual testing / README
`apps/pengpt-signature-lab/README.md` must tell a reviewer:
- `bun install && bun run dev`
- Pad: draw, download JSON, replay a fixture at pen speed
- Blind test: guess which replay is real; scoreboard persists in localStorage
- Forensics: open a fixture, read the looks-human score and the fixture classifier report
- Notes: stamp generated strokes onto a PDF and download (SYNTHETIC watermark)
- Why there is no Cloudflare Pages deploy
- How to run PenGPT generation on a laptop; that this cloud run **did** download `hand.npz` and emit real model strokes
- Consent template + fixtures-only rule

## Acceptance criteria
- [ ] `cd apps/pengpt-signature-lab && bun install && bun run dev` works
- [ ] `apps/pengpt-signature-lab/README.md` has run steps and a manual test checklist
- [ ] Draw-to-sign pad records `{x,y,t,down}` and replays stroke files at pen speed
- [ ] Python generator wraps PenGPT (`Pen.write`, GitHub release weights, writer or `.npy` style) and writes the same JSON schema + watermarked SVG
- [ ] Blind comparison for 4 fixture volunteers; randomised order; localStorage scoreboard
- [ ] TypeScript forensics scorer with unit tests; honest limits documented in HOW_IT_WORKS.md
- [ ] Every generated file has `synthetic: true`; UI shows a SYNTHETIC mark
- [ ] `CONSENT.md` template present; fixtures only
- [ ] No Cloudflare Pages (or other) deploy config
- [ ] CI: `.github/workflows/pengpt-signature-lab.yml` (setup-bun, `bun test`, `bun run build`)
- [ ] Demo PR includes at least one screenshot **and** one video

## Validation (PR)
- Screenshot: pad replaying a generated signature beside a real fixture, SYNTHETIC visible; or blind-test / forensics report
- Video: open app → replay both → blind guess → forensics report
- README: run steps + checklist match the criteria above
