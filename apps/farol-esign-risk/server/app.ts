import express from "express";
import { toApiEnvelope, toApiSummary } from "./serialize";
import { getEnvelope, listSummaries, resetStore, signEnvelope } from "./store";

export const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, fixture: "lumin-sign-lab" });
});

app.get("/api/envelopes", (_req, res) => {
  res.json({ envelopes: listSummaries().map(toApiSummary) });
});

app.get("/api/envelopes/:id", (req, res) => {
  const envelope = getEnvelope(req.params.id);
  if (!envelope) {
    res.status(404).json({ error: "Envelope not found" });
    return;
  }
  res.json({ envelope: toApiEnvelope(envelope) });
});

app.get("/api/envelopes/:id/audit", (req, res) => {
  const envelope = getEnvelope(req.params.id);
  if (!envelope) {
    res.status(404).json({ error: "Envelope not found" });
    return;
  }
  res.json({ audit: envelope.audit });
});

app.post("/api/envelopes/:id/sign", (req, res) => {
  const partyId = String(req.body?.partyId ?? "");
  const signatureName = String(req.body?.signatureName ?? "");
  if (!partyId) {
    res.status(400).json({ error: "partyId is required" });
    return;
  }
  try {
    const envelope = signEnvelope(req.params.id, partyId, signatureName);
    res.json({ envelope: toApiEnvelope(envelope) });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error
      ? Number((error as { status: number }).status)
      : 500;
    const message = error instanceof Error ? error.message : "Sign failed";
    res.status(status || 500).json({ error: message });
  }
});

app.post("/api/reset", (_req, res) => {
  resetStore();
  res.json({ ok: true, envelopes: listSummaries().map(toApiSummary) });
});
