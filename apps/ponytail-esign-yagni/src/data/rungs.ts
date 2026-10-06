import type { RungId } from "../types";

export const RUNGS: { id: RungId; label: string; short: string }[] = [
  { id: 1, label: "Does this need to exist?", short: "YAGNI" },
  { id: 2, label: "Already in this codebase?", short: "Repo" },
  { id: 3, label: "Stdlib does it?", short: "Stdlib" },
  { id: 4, label: "Native platform feature?", short: "Native" },
  { id: 5, label: "Installed dependency?", short: "Dep" },
  { id: 6, label: "Can it be one line?", short: "One line" },
  { id: 7, label: "Only then: the minimum", short: "Minimum" },
];
