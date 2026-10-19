import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { DeterminismReport, FrameCompare } from "../src/types";

const HF = "0.8.174";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const times = [1, 8, 16, 24];

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function have(bin: string): boolean {
  const r = spawnSync(bin, ["-version"], { encoding: "utf8" });
  return r.status === 0 || r.status === 1 || Boolean(r.stdout || r.stderr);
}

function extractFrame(mp4: string, dest: string, timeSec: number): void {
  execFileSync(
    "ffmpeg",
    ["-y", "-ss", String(timeSec), "-i", mp4, "-frames:v", "1", "-update", "1", "-q:v", "2", dest],
    { stdio: "pipe" },
  );
}

const videos = [
  {
    id: "lumin-sign-launch",
    committedPath: join(root, "public", "renders", "lumin-sign-launch.mp4"),
    project: join(root, "videos", "lumin-sign-launch"),
    skill: "product-launch-video",
    duration: 30,
  },
  {
    id: "pr-24-walkthrough",
    committedPath: join(root, "public", "renders", "pr-24-walkthrough.mp4"),
    project: join(root, "videos", "pr-24-walkthrough"),
    skill: "pr-to-video",
    duration: 16,
  },
];

const chromeOk = have("google-chrome") || have("chromium") || have("chrome");
const ffmpegOk = have("ffmpeg");
const canRerender = chromeOk && ffmpegOk;
const tmp = join(root, ".determinism-tmp");
mkdirSync(tmp, { recursive: true });

const report: DeterminismReport = {
  hyperframes: HF,
  createdAt: new Date().toISOString(),
  notes: [
    "Container SHA-256 often differs across encodes even when pixels match (MP4 metadata, encoder timestamps).",
    "Frame PNG hashes at fixed timestamps are the visual check.",
    canRerender
      ? "Re-render ran in this environment with hyperframes@0.8.174 --fps 24 --crf 28 --workers 1."
      : "Re-render skipped (need local Chrome + FFmpeg). Reporting committed hashes only.",
  ],
  videos: [],
};

for (const v of videos) {
  if (!existsSync(v.committedPath)) {
    report.videos.push({
      id: v.id,
      committedPath: v.committedPath,
      committedSha256: "",
      rerenderPath: null,
      rerenderSha256: null,
      containerMatch: null,
      frames: [],
      skippedReason: "committed MP4 missing — run bun run render first",
    });
    continue;
  }
  const committedSha256 = sha256File(v.committedPath);
  let rerenderPath: string | null = null;
  let rerenderSha256: string | null = null;
  let skippedReason: string | undefined;
  const frames: FrameCompare[] = [];

  if (canRerender) {
    rerenderPath = join(tmp, `${v.id}-rerender.mp4`);
    const args = [
      "--yes",
      `hyperframes@${HF}`,
      "render",
      "--skill",
      v.skill,
      "--fps",
      "24",
      "--crf",
      "28",
      "--workers",
      "1",
      "-o",
      rerenderPath,
    ];
    const rendered = spawnSync("npx", args, {
      cwd: v.project,
      stdio: "inherit",
      env: { ...process.env, HYPERFRAMES_SKIP_SKILLS: "1" },
    });
    if (rendered.status !== 0 || !existsSync(rerenderPath)) {
      skippedReason = `re-render failed (exit ${rendered.status})`;
      rerenderPath = null;
    } else {
      rerenderSha256 = sha256File(rerenderPath);
    }
  } else {
    skippedReason = "Chrome/FFmpeg not available for a live re-render";
  }

  const sampleTimes = times.filter((t) => t < v.duration);
  for (const timeSec of sampleTimes) {
    const a = join(tmp, `${v.id}-a-${timeSec}.png`);
    extractFrame(v.committedPath, a, timeSec);
    const committedFrame = sha256File(a);
    let rerenderFrame: string | null = null;
    if (rerenderPath) {
      const b = join(tmp, `${v.id}-b-${timeSec}.png`);
      extractFrame(rerenderPath, b, timeSec);
      rerenderFrame = sha256File(b);
    }
    frames.push({
      timeSec,
      committedSha256: committedFrame,
      rerenderSha256: rerenderFrame,
      match: rerenderFrame == null ? null : rerenderFrame === committedFrame,
    });
  }

  const rel = (p: string | null) =>
    p ? p.replace(`${root}/`, "").replace(/^\.determinism-tmp\//, ".determinism-tmp/") : null;
  report.videos.push({
    id: v.id,
    committedPath: rel(v.committedPath) ?? v.committedPath,
    committedSha256,
    rerenderPath: rel(rerenderPath),
    rerenderSha256,
    containerMatch:
      rerenderSha256 == null ? null : rerenderSha256 === committedSha256,
    frames,
    skippedReason,
  });
}

const out = join(root, "public", "renders", "determinism.json");
mkdirSync(join(root, "public", "renders"), { recursive: true });
writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
copyFileSync(out, join(root, "videos", "lumin-sign-launch", "renders", "determinism.json"));
console.log(`wrote ${out}`);
console.log(JSON.stringify(report, null, 2));
