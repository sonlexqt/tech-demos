import { bindFieldsToSigners, placeFields, requiredFieldsFor } from "../src/fields/prep";
import { resolveSigningOrder } from "../src/signers/routing";
import type { SignatureRequest } from "../src/types";

export function runFieldTests(): void {
  const request: SignatureRequest = {
    id: "sr_fields",
    title: "SOW",
    signingType: "ORDER",
    status: "sent",
    signers: [
      { id: "signer_1", email: "a@x.test", name: "A", group: 1, status: "pending" },
    ],
    fields: [],
    expiresAt: Date.now() + 1_000,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };
  resolveSigningOrder(request);
  placeFields(request);
  bindFieldsToSigners(request);
  const required = requiredFieldsFor(request, "signer_1");
  if (required.length !== 2) throw new Error("signature + date are required; initials are not");
}
