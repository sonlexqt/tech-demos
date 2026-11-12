import "./style.css";

type Fixture = {
  id: string;
  title: string;
  documentType: string;
  planted: boolean;
  plantedIssueCount: number;
  pdfUrl: string;
};

type Health = {
  mode: "mock" | "live";
  mock: boolean;
  label: string;
  questionCount: number;
  confidenceThreshold: number;
};

type CheckRow = {
  id: string;
  label: string;
  group: string;
  hint: string;
  verdict: "pass" | "fail" | "human" | "na";
  answer: {
    type: string;
    noul?: number;
    choice?: string;
    score?: number;
    confidence: number;
    probabilities?: Record<string, number>;
  };
};

type Preflight = {
  mode: string;
  mock: boolean;
  label: string;
  model: string;
  fixtureId: string | null;
  truthTitle: string | null;
  latencyMs: number;
  costLabel: string;
  usage: { total_input_tokens: number; total_output_tokens: number };
  counts: { pass: number; fail: number; human: number; na: number };
  checks: CheckRow[];
  confidenceThreshold: number;
  outputTokensBilled: number;
};

const app = document.querySelector<HTMLDivElement>("#app")!;

const verdictLabel: Record<CheckRow["verdict"], string> = {
  pass: "green",
  fail: "red",
  human: "needs a human",
  na: "n/a",
};

function fmtProb(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(2);
}

function answerSummary(row: CheckRow): string {
  const a = row.answer;
  if (a.type === "noul") return `P(yes)=${fmtProb(a.noul)}  conf=${fmtProb(a.confidence)}`;
  if (a.type === "choice") return `${a.choice}  conf=${fmtProb(a.confidence)}`;
  if (a.type === "score") return `score=${fmtProb(a.score)}  conf=${fmtProb(a.confidence)}`;
  return `conf=${fmtProb(a.confidence)}`;
}

async function boot() {
  const [health, fixtures] = await Promise.all([
    fetch("/api/health").then((r) => r.json() as Promise<Health>),
    fetch("/api/fixtures").then((r) => r.json() as Promise<Fixture[]>),
  ]);

  let selected = fixtures[0]?.id ?? "";
  let upload: { filename: string; pdfBase64: string } | null = null;
  let running = false;
  let result: Preflight | null = null;
  let toast = "";

  function pdfSrc(): string {
    if (upload) return `data:application/pdf;base64,${upload.pdfBase64}`;
    const f = fixtures.find((x) => x.id === selected);
    return f?.pdfUrl ?? "";
  }

  function render() {
    const grouped = new Map<string, CheckRow[]>();
    for (const row of result?.checks ?? []) {
      const list = grouped.get(row.group) ?? [];
      list.push(row);
      grouped.set(row.group, list);
    }

    app.innerHTML = `
      <div class="shell">
        <header class="top">
          <div class="brand">
            <div class="mark">L</div>
            <div>
              <h1>Sign-ready preflight</h1>
              <p class="sub">Lumin Sign · one Gemini Decisions pass before Send</p>
            </div>
          </div>
          <div class="badges">
            <span class="badge ${health.mock ? "mock" : "live"}">${health.label}</span>
            <span class="badge">${health.questionCount} checks</span>
            <span class="badge">conf ≥ ${health.confidenceThreshold}</span>
            <span class="badge">gemini-decision-1</span>
          </div>
        </header>
        <div class="layout">
          <aside class="card rail">
            <h2>Envelope PDF</h2>
            ${fixtures
              .map(
                (f) => `
              <button class="fixture" type="button" data-id="${f.id}" aria-pressed="${!upload && selected === f.id}">
                <b>${f.title}</b>
                <span>${f.documentType.toUpperCase()} · ${f.planted ? `${f.plantedIssueCount} planted issues` : "clean"}</span>
              </button>`,
              )
              .join("")}
            <label class="drop">
              Or upload a PDF
              <input id="file" type="file" accept="application/pdf" />
              <div>${upload ? upload.filename : "Bundled fixtures are synthetic. No customer data."}</div>
            </label>
            <div class="preview">
              <iframe title="PDF preview" src="${pdfSrc()}"></iframe>
            </div>
            <div class="actions">
              <button class="primary" id="run" ${running ? "disabled" : ""}>${running ? "Running…" : "Run preflight"}</button>
              <button class="send" id="send" ${result && result.counts.fail === 0 ? "" : "disabled"}>Send</button>
            </div>
            ${toast ? `<div class="toast">${toast}</div>` : ""}
          </aside>
          <section class="card results">
            <h2>Decisions results</h2>
            ${
              result
                ? `
              <div class="metrics">
                <div class="metric"><div class="k">Pass</div><div class="v">${result.counts.pass}</div></div>
                <div class="metric"><div class="k">Red</div><div class="v">${result.counts.fail}</div></div>
                <div class="metric"><div class="k">Needs a human</div><div class="v">${result.counts.human}</div></div>
                <div class="metric"><div class="k">Latency</div><div class="v">${result.latencyMs} ms</div></div>
                <div class="metric"><div class="k">Est. cost</div><div class="v">${result.costLabel}</div></div>
                <div class="metric"><div class="k">Output tokens</div><div class="v">${result.outputTokensBilled}</div></div>
              </div>
              <p class="sub">${result.mock ? "MOCK adapter — not a live Gemini call." : "LIVE Decisions API."} Model ${result.model}. ${result.usage.total_input_tokens} input tokens billed; output tokens are ${result.outputTokensBilled}.</p>
              ${[...grouped.entries()]
                .map(
                  ([group, rows]) => `
                <div class="group">
                  <h3>${group}</h3>
                  ${rows
                    .map(
                      (row) => `
                    <details class="check">
                      <summary>
                        <span class="pill ${row.verdict}">${verdictLabel[row.verdict]}</span>
                        <div>
                          <b>${row.label}</b>
                          <div class="hint">${row.hint}</div>
                        </div>
                        <div class="nums">${answerSummary(row)}</div>
                      </summary>
                      <div class="prob">${
                        row.answer.probabilities
                          ? Object.entries(row.answer.probabilities)
                              .map(([k, v]) => `${k}: ${fmtProb(v)}`)
                              .join(" · ")
                          : row.answer.type === "noul"
                            ? `P(no)=${fmtProb(1 - (row.answer.noul ?? 0))}`
                            : "—"
                      }</div>
                    </details>`,
                    )
                    .join("")}
                </div>`,
                )
                .join("")}
            `
                : `<p class="empty">Pick a fixture and run preflight. One request, ${health.questionCount} typed questions, calibrated probabilities, no generated prose.</p>`
            }
            <p class="note">Green / red fire only when confidence ≥ ${health.confidenceThreshold}. Below that, the row is “needs a human.” MSA-only checks are n/a on NDAs. Bundled media and mock eval numbers are mock until a live eval with GEMINI_API_KEY is committed.</p>
          </section>
        </div>
      </div>
    `;

    app.querySelectorAll<HTMLButtonElement>(".fixture").forEach((btn) => {
      btn.addEventListener("click", () => {
        selected = btn.dataset.id ?? selected;
        upload = null;
        result = null;
        toast = "";
        render();
      });
    });
    app.querySelector<HTMLInputElement>("#file")?.addEventListener("change", async (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const buf = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      buf.forEach((b) => {
        binary += String.fromCharCode(b);
      });
      upload = { filename: file.name, pdfBase64: btoa(binary) };
      result = null;
      toast = "";
      render();
    });
    app.querySelector("#run")?.addEventListener("click", async () => {
      running = true;
      toast = "";
      render();
      try {
        const payload = upload
          ? { filename: upload.filename, pdfBase64: upload.pdfBase64 }
          : { fixtureId: selected };
        const res = await fetch("/api/preflight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? res.statusText);
        result = body as Preflight;
      } catch (err) {
        toast = err instanceof Error ? err.message : String(err);
      } finally {
        running = false;
        render();
      }
    });
    app.querySelector("#send")?.addEventListener("click", () => {
      toast = "Envelope not sent — this is a demo. Preflight passed locally.";
      render();
    });
  }

  render();
}

boot();
