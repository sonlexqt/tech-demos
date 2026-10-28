import type { Envelope, Party, PartyRole } from "../types";

export type SignatureGate = {
  party: Party | undefined;
  canSign: boolean;
  waitingOn: string;
  headline: string;
  detail: string;
};

export function deriveSignatureStatus(
  envelope: Envelope | undefined,
  role: PartyRole,
): SignatureGate {
  if (!envelope) {
    return {
      party: undefined,
      canSign: false,
      waitingOn: "Loading",
      headline: "Loading envelope",
      detail: "Fetching signature status from the local fixture API.",
    };
  }

  const party = envelope.parties.find((item) => item.role === role);
  const counterpart = envelope.parties.find((item) => item.role !== role);
  const firstSigner = envelope.parties.find((item) => item.role === "signer");

  if (!party) {
    return {
      party: undefined,
      canSign: false,
      waitingOn: "No matching party",
      headline: "No party for this step",
      detail: `This envelope has no ${role}.`,
    };
  }

  if (envelope.status === "voided") {
    return {
      party,
      canSign: false,
      waitingOn: "Voided",
      headline: "Envelope is voided",
      detail: "A voided envelope cannot collect signatures.",
    };
  }

  if (envelope.status === "completed" || party.status === "signed") {
    return {
      party,
      canSign: false,
      waitingOn: "—",
      headline: party.status === "signed" ? `${party.name} already signed` : "Envelope complete",
      detail: "Nothing left to apply on this step.",
    };
  }

  if (role === "countersigner" && firstSigner && firstSigner.status !== "signed") {
    return {
      party,
      canSign: false,
      waitingOn: firstSigner.name,
      headline: "Waiting on the first signature",
      detail: `${firstSigner.name} must sign before countersignature.`,
    };
  }

  // Baseline gate: only an in-flight envelope can accept a signature.
  // Scenario B flips this one line — see scenarios/B-blast-radius/.
  const canSign = party.status === "pending" && envelope.status === "awaiting_signature";

  return {
    party,
    canSign,
    waitingOn: canSign ? party.name : (counterpart?.name ?? "—"),
    headline: canSign ? `${party.name} can sign now` : "Not this party's turn",
    detail: canSign
      ? "The shared hook opened the pad because status is awaiting_signature."
      : "The shared hook is holding the pad closed.",
  };
}
