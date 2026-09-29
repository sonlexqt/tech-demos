import type { JevMode } from "../core/types";

type Props = {
  mode: JevMode;
};

export function ModeBadge({ mode }: Props) {
  const live = mode === "live";
  return (
    <span
      className={`mode-badge ${live ? "is-live" : "is-fixture"}`}
      data-testid="mode-badge"
    >
      <span className="mode-dot" aria-hidden="true" />
      {live ? "Live Jev" : "Fixture mode"}
    </span>
  );
}
