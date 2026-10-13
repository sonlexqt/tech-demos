export interface RunFixture {
  label: string;
  capturedAt: string;
  command: string;
  durationMs: number;
  modelCalls: number;
  tokens: number;
  cache: {
    replayed: number;
    handedOff: number;
    missed: number;
  };
  tests: Array<{
    title: string;
    status: string;
    durationMs: number;
    modelCalls: number;
    cacheMode?: string;
  }>;
  notes: string;
}

async function loadRun(name: string): Promise<RunFixture | null> {
  try {
    const res = await fetch(`/fixtures/runs/${name}.json`);
    if (!res.ok) return null;
    return (await res.json()) as RunFixture;
  } catch {
    return null;
  }
}

function metric(value: string, label: string): string {
  return `<div class="metric"><b>${value}</b><span>${label}</span></div>`;
}

function card(run: RunFixture | null, fallback: string): string {
  if (!run) {
    return `<article><h3>${fallback}</h3><p class="note">Fixture missing. Run <code>bun run capture-results</code>.</p></article>`;
  }
  const tests = run.tests
    .map(
      (t) =>
        `<li>${t.title} — ${t.status}, ${t.durationMs} ms, ${t.modelCalls} model calls${t.cacheMode ? `, cache ${t.cacheMode}` : ""}</li>`,
    )
    .join("");
  return `
    <article>
      <h3>${run.label}</h3>
      <p class="note">${run.notes}</p>
      <div class="metrics">
        ${metric(`${(run.durationMs / 1000).toFixed(2)}s`, "Duration")}
        ${metric(String(run.modelCalls), "Model calls")}
        ${metric(String(run.cache.replayed), "Replayed")}
        ${metric(String(run.cache.missed + run.cache.handedOff), "Miss / handoff")}
      </div>
      <p class="note"><code>${run.command}</code></p>
      <ul class="note">${tests}</ul>
    </article>
  `;
}

export function renderResults(root: HTMLElement): void {
  root.innerHTML = `
    <section class="lede">
      <h2>Cold run vs cached replay</h2>
      <p class="muted">
        Captured reports from this fixture. Replay uses committed
        <code>fixtures/e2e-cache/</code> and makes no model calls.
      </p>
    </section>
    <div class="compare" id="compare">
      <article><p class="note">Loading fixtures…</p></article>
    </div>
  `;
  void (async () => {
    const [cold, replay, drift] = await Promise.all([
      loadRun("cold"),
      loadRun("replay"),
      loadRun("drift"),
    ]);
    const box = document.getElementById("compare");
    if (!box) return;
    box.innerHTML = `${card(cold, "Cold")} ${card(replay, "Cached replay")}`;
    if (drift) {
      box.insertAdjacentHTML(
        "afterend",
        `<section class="card" style="margin-top:1rem">
          <h2>UI drift run</h2>
          <p class="note">${drift.notes}</p>
          <div class="metrics">
            ${metric(`${(drift.durationMs / 1000).toFixed(2)}s`, "Duration")}
            ${metric(String(drift.modelCalls), "Model calls")}
            ${metric(String(drift.cache.handedOff + drift.cache.missed), "Re-planned")}
            ${metric(String(drift.cache.replayed), "Replayed")}
          </div>
        </section>`,
      );
    }
  })();
}
