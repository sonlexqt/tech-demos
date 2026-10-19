# PR #24 snapshot

Skill: `/pr-to-video` from HyperFrames 0.8.174.

## What ran live

In this cloud-agent environment, GitHub CLI **was authenticated** (read-only).
The skill's real scripts were used:

```bash
node ~/.agents/skills/pr-to-video/scripts/fetch-pr.mjs \
  --pr "https://github.com/sonlexqt/tech-demos/pull/24" \
  --out-dir ./capture

node ~/.agents/skills/pr-to-video/scripts/ingest.mjs \
  --pr-json ./capture/pr.json \
  --diff ./capture/diff.patch \
  --out-dir ./capture/extracted

node ~/.agents/skills/pr-to-video/scripts/fetch-people-avatars.mjs \
  --people ./capture/extracted/people.json
```

`fetch-pr.mjs` writes `capture/pr.json` + `capture/diff.patch` (36 files, ~372 KB diff).
`ingest.mjs` is offline. Avatars are best-effort.

## Why the snapshot is committed

A later clone of this demo may not have `gh` network/auth. The committed
`capture/` + `assets/*.png` are the skill's own artifacts, not a hand-invented PR.
Re-fetch with the same commands if you want a fresher copy of the still-open PR.

HeyGen auth was **signed out**; local Kokoro/MusicGen were not installed, so this
cut is silent (`music: none`).
