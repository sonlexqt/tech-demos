# HyperFrames e-sign feature-reveal video

## Source
- Bookmark: https://github.com/heygen-com/hyperframes
- Slug: `hyperframes-esign-video`
- Tracking id: `gh-heygen-com-hyperframes` (GitHub trending)

## Goal (single-user MVP)
In under two minutes a reviewer can (1) click through a **fake Lumin Sign fixture** (upload MSA → place signature field → sign → countersign → audit trail), (2) watch a ~30s HyperFrames **product-launch** MP4 of that same fixture, (3) inspect the HTML/CSS scene source beside a **live seekable preview**, (4) optionally open a short **PR-to-video** walkthrough of tech-demos PR #24, and (5) run a **determinism check** that re-renders (when FFmpeg/Chrome are present) and reports an honest hash/frame comparison. Committed MP4s make the app usable offline; re-render is a documented extra script.

## Out of scope
- The real Lumin Sign product, accounts, or production documents
- HeyGen cloud render, auth keys, TTS, BGM, or captions (offline/silent cut)
- Docker / AWS Lambda / hosted Studio
- Invented HyperFrames features beyond the pinned CLI + published skills
- Multi-user, deploy, or a shared monorepo package

## Stack
- Runtime/tooling: Bun (`bun install && bun run dev`)
- UI/framework: Vite + TypeScript (vanilla DOM)
- Video: **HyperFrames CLI `0.8.174`** (Apache-2.0), Node 22+, FFmpeg, GSAP 3.14.2 seekable timelines
- Skills used (real, not invented): `/product-launch-video`, `/pr-to-video`, plus domain skills they load (`hyperframes-core`, `hyperframes-cli`, `hyperframes-animation`, `hyperframes-creative`)
- Canvas: `1280×720` @ 24 fps (same 16:9 contract as landscape; smaller committed MP4s)

## Manual testing / README
What `apps/hyperframes-esign-video/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`)
- Open the Vite URL; no WebMCP flags; Agent panel N/A
- Click the fixture wizard through all five steps; confirm audit trail rows
- Play committed launch + PR MP4s; open a scene’s HTML; drag the seekable preview playhead
- Run **Check determinism** (or `bun run check:determinism`); read the honest pass/fail
- Optional re-render: needs Node 22+, FFmpeg, Chrome (`bun run render`)
- Pin note: HyperFrames `0.8.174`; no API keys
- Pass/fail checklist for fixture, videos, source, seek, determinism

## Acceptance criteria
- [x] `cd apps/hyperframes-esign-video && bun install && bun run dev` works
- [x] `PLAN.md`, `README.md` (run + manual test), and `HOW_IT_WORKS.md` (concepts + mermaid) are present
- [x] Fake Lumin Sign fixture covers upload MSA, place signature field, sign, countersign, audit trail — own fixtures only
- [x] ~30s launch video authored as HTML/CSS scenes via the product-launch-video flow and rendered with `npx hyperframes@0.8.174 render --skill=product-launch-video`
- [x] Bonus PR walkthrough MP4 for https://github.com/sonlexqt/tech-demos/pull/24 via `/pr-to-video` (live `gh` if available; otherwise a committed snapshot, documented honestly)
- [x] Bun app shows scene HTML next to MP4s, live seekable preview, and a determinism check with an honest result
- [x] Scene sources + reasonably small MP4s are committed; re-render is optional and documented; no keys
- [x] `tracking/seen-bookmarks.json` marks `gh-heygen-com-hyperframes` as proposed **and** built in this same PR
- [x] Demo PR includes at least one screenshot **and** at least one video of the running app (launch MP4 is additional)

## Validation (PR)
- Screenshot: App showing fixture + launch video + scene source (or seekable preview) in one frame
- Video: Open app → click fixture steps → play launch MP4 → seek HTML preview → open PR video → run determinism check
- README: Confirm run steps + manual test notes match the checklist above
