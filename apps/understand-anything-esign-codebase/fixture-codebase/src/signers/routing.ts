import type { SignatureRequest, Signer } from "../types";

export function resolveSigningOrder(request: SignatureRequest): Signer[] {
  if (request.signingType === "PARALLEL") {
    for (const signer of request.signers) signer.status = "awaiting";
    return request.signers;
  }

  const minGroup = Math.min(...request.signers.map((signer) => signer.group));
  for (const signer of request.signers) {
    signer.status = signer.group === minGroup ? "awaiting" : "pending";
  }
  return request.signers.filter((signer) => signer.status === "awaiting");
}

export function nextEligibleSigner(request: SignatureRequest): Signer[] {
  if (request.signingType === "PARALLEL") {
    return request.signers.filter((signer) => signer.status === "awaiting");
  }

  const remaining = request.signers.filter((signer) => signer.status !== "signed");
  if (remaining.length === 0) return [];

  const minGroup = Math.min(...remaining.map((signer) => signer.group));
  for (const signer of remaining) {
    if (signer.status === "declined") continue;
    signer.status = signer.group === minGroup ? "awaiting" : "pending";
  }
  return remaining.filter((signer) => signer.status === "awaiting");
}

export function markSigned(request: SignatureRequest, signerId: string): Signer {
  const signer = request.signers.find((item) => item.id === signerId);
  if (!signer) throw new Error(`unknown signer ${signerId}`);
  if (signer.status !== "awaiting") {
    throw new Error(`signer ${signerId} is not next in ORDER`);
  }
  signer.status = "signed";
  request.lastActivityAt = Date.now();
  if (request.signers.every((item) => item.status === "signed")) {
    request.status = "completed";
  } else {
    request.status = "in_progress";
    nextEligibleSigner(request);
  }
  return signer;
}
