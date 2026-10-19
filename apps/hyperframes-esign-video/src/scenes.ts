export type SceneMeta = {
  id: string;
  title: string;
  start: number;
  duration: number;
  src: string;
};

export type VideoProject = {
  id: string;
  title: string;
  skill: string;
  duration: number;
  width: number;
  height: number;
  hfDir: string;
  indexUrl: string;
  mp4Url: string;
  scenes: SceneMeta[];
};

export const LAUNCH: VideoProject = {
  id: "launch",
  title: "Lumin Sign feature reveal",
  skill: "/product-launch-video",
  duration: 30,
  width: 1280,
  height: 720,
  hfDir: "videos/lumin-sign-launch",
  indexUrl: "/hf/lumin-sign-launch/index.html",
  mp4Url: "/renders/lumin-sign-launch.mp4",
  scenes: [
    { id: "01-hook", title: "Hook", start: 0, duration: 5, src: "/hf/lumin-sign-launch/compositions/frames/01-hook.html" },
    { id: "02-upload", title: "Upload MSA", start: 5, duration: 5, src: "/hf/lumin-sign-launch/compositions/frames/02-upload.html" },
    { id: "03-place-field", title: "Place field", start: 10, duration: 5, src: "/hf/lumin-sign-launch/compositions/frames/03-place-field.html" },
    { id: "04-sign", title: "Sign", start: 15, duration: 5, src: "/hf/lumin-sign-launch/compositions/frames/04-sign.html" },
    { id: "05-countersign", title: "Countersign", start: 20, duration: 5, src: "/hf/lumin-sign-launch/compositions/frames/05-countersign.html" },
    { id: "06-audit", title: "Audit trail", start: 25, duration: 5, src: "/hf/lumin-sign-launch/compositions/frames/06-audit.html" },
  ],
};

export const PR24: VideoProject = {
  id: "pr24",
  title: "PR #24 walkthrough",
  skill: "/pr-to-video",
  duration: 16,
  width: 1280,
  height: 720,
  hfDir: "videos/pr-24-walkthrough",
  indexUrl: "/hf/pr-24-walkthrough/index.html",
  mp4Url: "/renders/pr-24-walkthrough.mp4",
  scenes: [
    { id: "01-hook", title: "Hook", start: 0, duration: 3, src: "/hf/pr-24-walkthrough/compositions/frames/01-hook.html" },
    { id: "02-change", title: "Change", start: 3, duration: 3, src: "/hf/pr-24-walkthrough/compositions/frames/02-change.html" },
    { id: "03-diff", title: "Diff hunk", start: 6, duration: 4, src: "/hf/pr-24-walkthrough/compositions/frames/03-diff.html" },
    { id: "04-impact", title: "Impact", start: 10, duration: 3, src: "/hf/pr-24-walkthrough/compositions/frames/04-impact.html" },
    { id: "05-credits", title: "Credits", start: 13, duration: 3, src: "/hf/pr-24-walkthrough/compositions/frames/05-credits.html" },
  ],
};

export const PROJECTS = [LAUNCH, PR24];
