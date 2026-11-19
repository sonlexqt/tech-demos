import { CONTRACT_SECTIONS } from "./contract";
import { AuditLog, installAudit } from "./audit";
import { executeTools } from "./agent/tools";
import { parseMockCommand } from "./agent/mock-parser";
import { planWithGemini } from "./agent/gemini";
import { installProtection, protectLockedRanges } from "./protection";
import { readSheetValues, waitForFormulas, type UniverFacade } from "./sheet-io";
import { roundMoney } from "./quote-math";
import { bootBrowserUniver, bootHiddenUniver } from "./univer-browser";
import { signEnvelope } from "./sign/freeze";
import { tamperSeats, verifyRecord } from "./sign/verify";
import { bytesFromBase64 } from "./sign/hash";
import type { SignedRecord } from "./types";
import type { IWorkbookData } from "@univerjs/core";

const money = (n: number) =>
  `$${roundMoney(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} missing`);
  return el;
}

function renderContract(): void {
  const root = $("contract-sections");
  root.innerHTML = CONTRACT_SECTIONS.map(
    (s) => `<div class="contract-block"><h3>${s.heading}</h3><p>${s.body}</p></div>`,
  ).join("");
}

function renderHud(api: UniverFacade): void {
  const values = readSheetValues(api.getActiveWorkbook()!.getActiveSheet());
  $("totals-hud").innerHTML = [
    ["Seats", String(values.seats)],
    ["Term", `${values.termYears} year(s)`],
    ["Discount", `${roundMoney(values.totals.discountRate * 100)}%`],
    ["Total due", money(values.totals.total)],
  ]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
    .join("");
}

function renderAudit(log: AuditLog): void {
  const list = $("audit-list");
  if (log.entries.length === 0) {
    list.innerHTML = "<li>No edits yet. Defaults: 25 seats, 1-year term, add-ons off.</li>";
    return;
  }
  list.innerHTML = [...log.entries]
    .reverse()
    .map(
      (e) => `<li>
        <div class="who ${e.actor}">${e.actor} · ${e.source}</div>
        <div><code>${e.cell}</code> ${e.label}: <strong>${e.oldValue}</strong> → <strong>${e.newValue}</strong></div>
        <div>Total ${money(Number(e.total))} · ${e.at}</div>
      </li>`,
    )
    .join("");
}

async function refresh(api: UniverFacade, log: AuditLog): Promise<void> {
  await waitForFormulas(api, 2500);
  const workbook = api.getActiveWorkbook();
  if (!workbook) return;
  const values = readSheetValues(workbook.getActiveSheet());
  log.recordDiff(values);
  renderHud(api);
  renderAudit(log);
}

function setAgentOut(text: string): void {
  $("agent-out").textContent = text;
}

async function geminiAvailable(): Promise<boolean> {
  try {
    const res = await fetch("/api/gemini-status");
    if (!res.ok) return false;
    const json = (await res.json()) as { enabled?: boolean };
    return Boolean(json.enabled);
  } catch {
    return false;
  }
}

function showSigned(record: SignedRecord): void {
  const panel = $("signed-panel") as HTMLElement;
  panel.hidden = false;
  $("status-badge").className = "badge signed";
  $("status-badge").textContent = "Signed";
  ($("btn-sign") as HTMLButtonElement).disabled = true;
  $("signed-meta").textContent =
    `${record.envelopeId} · ${record.signerName} · ${record.signedAt} · total ${money(record.displayed.totals.total)}`;
  $("hash-box").innerHTML = `
    <div><strong>Snapshot SHA-256</strong><br>${record.snapshotSha256}</div>
    <div style="margin-top:8px"><strong>Content PDF SHA-256</strong><br>${record.contentPdfSha256}</div>
    <div style="margin-top:8px"><strong>Binding SHA-256</strong> (canonical snapshot JSON || PDF bytes)<br>${record.bindingSha256}</div>`;

  const pdfBytes = bytesFromBase64(record.signedPdfBase64);
  const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const frame = $("pdf-frame") as HTMLIFrameElement;
  frame.hidden = false;
  frame.src = pdfUrl;
  const dl = $("download-pdf") as HTMLAnchorElement;
  dl.href = pdfUrl;
  const snap = new Blob([JSON.stringify(record.snapshot, null, 2)], { type: "application/json" });
  ($("download-snapshot") as HTMLAnchorElement).href = URL.createObjectURL(snap);
}

async function runVerify(record: SignedRecord, snapshot: unknown, label: string): Promise<void> {
  const out = $("verify-out");
  out.textContent = `${label}…`;
  const hidden = bootHiddenUniver(snapshot as IWorkbookData);
  try {
    await waitForFormulas(hidden.api, 6000);
    const result = await verifyRecord(record, snapshot, hidden.api);
    if (result.ok) {
      out.className = "output verify-ok";
      out.textContent = `${label}\nPASS — what you signed = what you saw.\nRecomputed total ${money(result.recomputedTotal ?? 0)}\nBinding ${result.bindingSha256}`;
    } else {
      out.className = "output verify-fail";
      out.textContent = `${label}\nFAIL\n${result.reasons.join("\n")}\nRecomputed total ${result.recomputedTotal ?? "n/a"}`;
    }
  } finally {
    hidden.dispose();
  }
}

async function main(): Promise<void> {
  renderContract();
  const host = $("univer");
  const api = bootBrowserUniver(host);
  await waitForFormulas(api, 6000);

  const log = new AuditLog();
  const workbook = api.getActiveWorkbook();
  if (!workbook) throw new Error("Workbook failed to start");
  log.snapshotInputs(readSheetValues(workbook.getActiveSheet()));
  installProtection(api);
  installAudit(api, log);
  await protectLockedRanges(workbook);
  log.onChange = () => {
    renderAudit(log);
    renderHud(api);
  };
  renderHud(api);
  renderAudit(log);

  const hasGemini = await geminiAvailable();
  $("agent-mode").textContent = hasGemini
    ? "Mode: Gemini tool calling (set_cell / get_totals / undo) via /api/gemini"
    : "Mode: mock parser (no API key). Optional GEMINI_API_KEY enables Gemini.";

  ($("btn-undo") as HTMLButtonElement).addEventListener("click", async () => {
    log.actor = "signer";
    log.source = "undo";
    workbook.undo();
    await refresh(api, log);
  });

  ($("btn-agent-undo") as HTMLButtonElement).addEventListener("click", async () => {
    const results = await executeTools(api, log, [{ name: "undo", args: {} }]);
    setAgentOut(results.map((r) => `${r.name}: ${r.detail}`).join("\n"));
    await refresh(api, log);
  });

  const runAgent = async () => {
    const prompt = ($("agent-input") as HTMLTextAreaElement).value;
    setAgentOut("Running…");
    try {
      const planned = hasGemini ? await planWithGemini(prompt) : { calls: parseMockCommand(prompt), text: "" };
      if (planned.calls.length === 0) {
        setAgentOut((planned.text || "No tool calls. Try: make it 40 seats, 2-year term").trim());
        return;
      }
      const results = await executeTools(api, log, planned.calls);
      const lines = [
        planned.text && `model: ${planned.text}`,
        `tools: ${planned.calls.map((c) => c.name).join(", ")}`,
        ...results.map((r) => `${r.ok ? "ok" : "err"} ${r.name}: ${r.detail}`),
      ].filter(Boolean);
      setAgentOut(lines.join("\n"));
      await refresh(api, log);
    } catch (error) {
      setAgentOut(String(error));
    }
  };

  ($("btn-agent") as HTMLButtonElement).addEventListener("click", () => void runAgent());
  document.querySelectorAll<HTMLButtonElement>("[data-prompt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      ($("agent-input") as HTMLTextAreaElement).value = btn.dataset.prompt ?? "";
      void runAgent();
    });
  });

  let record: SignedRecord | null = null;

  ($("btn-sign") as HTMLButtonElement).addEventListener("click", async () => {
    ($("btn-sign") as HTMLButtonElement).disabled = true;
    try {
      record = await signEnvelope(api, log.entries);
      showSigned(record);
      $("verify-out").textContent = "Signed. Click Verify, then Tamper.";
    } catch (error) {
      ($("btn-sign") as HTMLButtonElement).disabled = false;
      $("verify-out").textContent = String(error);
      $("signed-panel").hidden = false;
    }
  });

  ($("btn-verify") as HTMLButtonElement).addEventListener("click", async () => {
    if (!record) return;
    await runVerify(record, record.snapshot, "Verify original snapshot");
  });

  ($("btn-tamper") as HTMLButtonElement).addEventListener("click", async () => {
    if (!record) return;
    const tampered = tamperSeats(record.snapshot, 999);
    await runVerify(record, tampered, "Verify TAMPERED snapshot (seats=999)");
  });
}

void main();
