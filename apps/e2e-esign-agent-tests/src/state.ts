import { ENVELOPE } from "./copy";

export type EnvelopeStatus =
  | "draft"
  | "awaiting_signer1"
  | "awaiting_signer2"
  | "completed";

export interface PlacedField {
  id: string;
  signer: 1 | 2;
  x: number;
  y: number;
  value: string;
}

export interface EnvelopeState {
  status: EnvelopeStatus;
  fields: PlacedField[];
}

const KEY = "lumin-sign-fixture-envelope";
const VARIANT_KEY = "lumin-sign-fixture-variant";

const initial = (): EnvelopeState => ({
  status: "draft",
  fields: [],
});

export function loadEnvelope(): EnvelopeState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return initial();
    const parsed = JSON.parse(raw) as EnvelopeState;
    if (!parsed || !Array.isArray(parsed.fields)) return initial();
    return parsed;
  } catch {
    return initial();
  }
}

export function saveEnvelope(state: EnvelopeState): void {
  sessionStorage.setItem(KEY, JSON.stringify(state));
}

export function resetEnvelope(): EnvelopeState {
  const next = initial();
  saveEnvelope(next);
  return next;
}

export function readVariantFromLocation(): "stable" | "drift" {
  const hash = location.hash.toLowerCase();
  if (hash.includes("stable")) {
    sessionStorage.setItem(VARIANT_KEY, "stable");
    return "stable";
  }
  if (hash.includes("drift") || hash.includes("bug")) {
    sessionStorage.setItem(VARIANT_KEY, "drift");
    return "drift";
  }
  const stored = sessionStorage.getItem(VARIANT_KEY);
  return stored === "drift" ? "drift" : "stable";
}

export function setVariant(variant: "stable" | "drift"): void {
  sessionStorage.setItem(VARIANT_KEY, variant);
}

export function statusLabel(status: EnvelopeStatus, bug: boolean): string {
  if (status === "completed" && bug) return "Awaiting countersignature";
  switch (status) {
    case "draft":
      return "Draft";
    case "awaiting_signer1":
      return "Awaiting first signature";
    case "awaiting_signer2":
      return "Awaiting countersignature";
    case "completed":
      return "Completed";
  }
}

export function envelopeHeading(): string {
  return `${ENVELOPE.title} · ${ENVELOPE.id}`;
}
