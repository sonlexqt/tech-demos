import type { Envelope, EnvelopeSummary } from "../types";

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }
  return payload;
}

export async function listEnvelopes(): Promise<EnvelopeSummary[]> {
  const payload = await readJson<{ envelopes: EnvelopeSummary[] }>(
    await fetch("/api/envelopes"),
  );
  return payload.envelopes;
}

export async function getEnvelope(id: string): Promise<Envelope> {
  const payload = await readJson<{ envelope: Envelope }>(
    await fetch(`/api/envelopes/${id}`),
  );
  return payload.envelope;
}

export async function getAudit(id: string): Promise<Envelope["audit"]> {
  const payload = await readJson<{ audit: Envelope["audit"] }>(
    await fetch(`/api/envelopes/${id}/audit`),
  );
  return payload.audit;
}

export async function signEnvelope(
  id: string,
  partyId: string,
  signatureName: string,
): Promise<Envelope> {
  const payload = await readJson<{ envelope: Envelope }>(
    await fetch(`/api/envelopes/${id}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partyId, signatureName }),
    }),
  );
  return payload.envelope;
}

export async function resetDemo(): Promise<void> {
  await readJson(await fetch("/api/reset", { method: "POST" }));
}
