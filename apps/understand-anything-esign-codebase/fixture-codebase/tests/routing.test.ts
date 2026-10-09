import { markSigned, nextEligibleSigner, resolveSigningOrder } from "../src/signers/routing";
import type { SignatureRequest } from "../src/types";

function sample(signingType: "ORDER" | "PARALLEL"): SignatureRequest {
  return {
    id: "sr_route",
    title: "NDA",
    signingType,
    status: "sent",
    signers: [
      { id: "signer_1", email: "a@x.test", name: "A", group: 1, status: "pending" },
      { id: "signer_2", email: "b@x.test", name: "B", group: 2, status: "pending" },
    ],
    fields: [],
    expiresAt: Date.now() + 1_000,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };
}

export function runRoutingTests(): void {
  const ordered = sample("ORDER");
  resolveSigningOrder(ordered);
  if (ordered.signers[1]?.status !== "pending") throw new Error("group 2 waits in ORDER");
  markSigned(ordered, "signer_1");
  const next = nextEligibleSigner(ordered);
  if (next[0]?.id !== "signer_2") throw new Error("group 2 becomes awaiting after group 1 signs");

  const parallel = sample("PARALLEL");
  resolveSigningOrder(parallel);
  if (!parallel.signers.every((signer) => signer.status === "awaiting")) {
    throw new Error("PARALLEL unlocks every signer");
  }
}
