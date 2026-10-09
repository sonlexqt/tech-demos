import { createSignatureRequest, validatePayload } from "../src/requests/create-request";
import { resetStore } from "../src/store";

const future = Date.now() + 86_400_000;

export function runCreateRequestTests(): void {
  resetStore();
  const errors = validatePayload({
    title: "",
    signingType: "ORDER",
    signers: [],
    expiresAt: Date.now() - 1,
  });
  if (errors.length < 3) throw new Error("expected title, signer, and expiry errors");

  const request = createSignatureRequest({
    title: "Acme Robotics — MSA (FY26)",
    signingType: "ORDER",
    signers: [
      { email: "counsel@lumin.test", name: "Ada Chen", group: 1 },
      { email: "legal@acme.test", name: "Priya Raman", group: 2 },
    ],
    expiresAt: future,
  });
  if (request.status !== "sent") throw new Error("new request should be sent");
  if (request.signers[0]?.status !== "awaiting") throw new Error("group 1 should be awaiting");
  if (request.fields.length === 0) throw new Error("fields should be placed on create");
}
