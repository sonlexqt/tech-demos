import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HF = "0.8.174";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRenders = join(root, "public", "renders");

const jobs = [
  {
    dir: join(root, "videos", "lumin-sign-launch"),
    out: join(root, "videos", "lumin-sign-launch", "renders", "video.mp4"),
    publicName: "lumin-sign-launch.mp4",
    skill: "product-launch-video",
  },
  {
    dir: join(root, "videos", "pr-24-walkthrough"),
    out: join(root, "videos", "pr-24-walkthrough", "renders", "video.mp4"),
    publicName: "pr-24-walkthrough.mp4",
    skill: "pr-to-video",
  },
];

function run(dir: string, args: string[]): void {
  const result = spawnSync("npx", ["--yes", `hyperframes@${HF}`, ...args], {
    cwd: dir,
    stdio: "inherit",
    env: {
      ...process.env,
      HYPERFRAMES_SKIP_SKILLS: "1",
    },
  });
  if (result.status !== 0) {
    throw new Error(`hyperframes ${args.join(" ")} failed in ${dir} (exit ${result.status})`);
  }
}

mkdirSync(publicRenders, { recursive: true });

for (const job of jobs) {
  mkdirSync(dirname(job.out), { recursive: true });
  console.log(`\n→ render ${job.skill} ${job.dir}`);
  run(job.dir, [
    "render",
    "--skill",
    job.skill,
    "--fps",
    "24",
    "--crf",
    "28",
    "--workers",
    "1",
    "-o",
    job.out,
  ]);
  if (!existsSync(job.out)) throw new Error(`missing ${job.out}`);
  const dest = join(publicRenders, job.publicName);
  copyFileSync(job.out, dest);
  console.log(`copied ${dest}`);
}

console.log("\nDone. Offline copies live in public/renders/.");
