import type { AuditEvent, Envelope, EnvelopeSummary } from "./types";

const clone = <T>(value: T): T => structuredClone(value);

function waitingOn(envelope: Envelope): string {
  if (envelope.status === "completed") return "—";
  if (envelope.status === "voided") return "Voided";
  const next = envelope.parties.find((party) => party.status === "pending");
  return next ? `${next.name} (${next.role})` : "—";
}

function event(
  id: string,
  at: string,
  actor: string,
  action: string,
  detail: string,
): AuditEvent {
  return { id, at, actor, action, detail };
}

function seedEnvelopes(): Envelope[] {
  return [
    {
      id: "env_offer",
      title: "Offer letter — Maya Chen",
      documentKind: "Offer letter",
      status: "awaiting_signature",
      createdAt: "2026-10-20T14:02:00.000Z",
      updatedAt: "2026-10-27T09:10:00.000Z",
      parties: [
        {
          id: "p_maya",
          name: "Maya Chen",
          email: "maya@example.com",
          role: "signer",
          status: "pending",
        },
        {
          id: "p_jordan",
          name: "Jordan Hale",
          email: "jordan@northstar.test",
          role: "countersigner",
          status: "pending",
        },
      ],
      body: [
        "Northstar Labs offers Maya Chen the role of Staff Product Designer, reporting to Jordan Hale, effective 16 November 2026.",
        "Base compensation is $186,000 per year, with a target bonus of 10% and an equity grant described in the accompanying option notice.",
        "This offer is contingent on countersignature by an officer of Northstar Labs and is void if not accepted within ten business days.",
      ],
      audit: [
        event("a1", "2026-10-20T14:02:00.000Z", "Jordan Hale", "created", "Envelope drafted from the offer template."),
        event("a2", "2026-10-27T09:10:00.000Z", "Lumin Sign Lab", "sent", "Sent to Maya Chen for review and signature."),
      ],
    },
    {
      id: "env_nda",
      title: "Mutual NDA — Harbor × Finch",
      documentKind: "Mutual NDA",
      status: "awaiting_signature",
      createdAt: "2026-10-18T11:30:00.000Z",
      updatedAt: "2026-10-26T16:44:00.000Z",
      parties: [
        {
          id: "p_sam",
          name: "Sam Okonkwo",
          email: "sam@finch.test",
          role: "signer",
          status: "signed",
          signedAt: "2026-10-26T16:44:00.000Z",
        },
        {
          id: "p_priya",
          name: "Priya Shah",
          email: "priya@harbor.test",
          role: "countersigner",
          status: "pending",
        },
      ],
      body: [
        "This mutual non-disclosure agreement is between Lumin Sign Lab and Finch Analytics for discussions about a possible countersign integration.",
        "Each party may share confidential product and customer information solely to evaluate that integration. Neither party may use the information for any other purpose.",
        "Obligations survive for three years after disclosure. The agreement is not effective until both parties have signed.",
      ],
      audit: [
        event("n1", "2026-10-18T11:30:00.000Z", "Priya Shah", "created", "Mutual NDA opened for Finch Analytics."),
        event("n2", "2026-10-22T08:05:00.000Z", "Lumin Sign Lab", "sent", "Sent to Sam Okonkwo."),
        event("n3", "2026-10-26T16:44:00.000Z", "Sam Okonkwo", "signed", "First party signed. Waiting on countersignature."),
      ],
    },
    {
      id: "env_msa",
      title: "Vendor MSA — Lampblack Print",
      documentKind: "Master services",
      status: "completed",
      createdAt: "2026-09-02T10:00:00.000Z",
      updatedAt: "2026-09-12T13:21:00.000Z",
      parties: [
        {
          id: "p_lee",
          name: "Lee Ortiz",
          email: "lee@lampblack.test",
          role: "signer",
          status: "signed",
          signedAt: "2026-09-10T15:03:00.000Z",
        },
        {
          id: "p_noor",
          name: "Noor Alvi",
          email: "noor@harbor.test",
          role: "countersigner",
          status: "signed",
          signedAt: "2026-09-12T13:21:00.000Z",
        },
      ],
      body: [
        "Lampblack Print will provide print and finishing services to Lumin Sign Lab under the attached rate card.",
        "Invoices are due net 30. Either party may terminate for convenience with thirty days' written notice.",
        "Both parties signed. This envelope is complete and locked.",
      ],
      audit: [
        event("m1", "2026-09-02T10:00:00.000Z", "Noor Alvi", "created", "Vendor MSA opened."),
        event("m2", "2026-09-10T15:03:00.000Z", "Lee Ortiz", "signed", "Vendor signed."),
        event("m3", "2026-09-12T13:21:00.000Z", "Noor Alvi", "countersigned", "Lumin Sign Lab countersigned. Envelope completed."),
      ],
    },
    {
      id: "env_void",
      title: "Statement of work — Q3 pop-up",
      documentKind: "Statement of work",
      status: "voided",
      createdAt: "2026-07-01T09:00:00.000Z",
      updatedAt: "2026-07-20T12:00:00.000Z",
      parties: [
        {
          id: "p_theo",
          name: "Theo Marsh",
          email: "theo@popup.test",
          role: "signer",
          status: "pending",
        },
      ],
      body: [
        "This statement of work covered a Q3 pop-up booth that was cancelled before either party signed.",
        "The envelope was voided on 20 July 2026. No signature is valid on a voided envelope.",
      ],
      audit: [
        event("v1", "2026-07-01T09:00:00.000Z", "Jordan Hale", "created", "SOW drafted."),
        event("v2", "2026-07-20T12:00:00.000Z", "Jordan Hale", "voided", "Pop-up cancelled. Envelope voided."),
      ],
    },
  ];
}

let envelopes = seedEnvelopes();

export function resetStore(): void {
  envelopes = seedEnvelopes();
}

export function listSummaries(): EnvelopeSummary[] {
  return envelopes.map((envelope) => ({
    id: envelope.id,
    title: envelope.title,
    documentKind: envelope.documentKind,
    status: envelope.status,
    updatedAt: envelope.updatedAt,
    waitingOn: waitingOn(envelope),
  }));
}

export function getEnvelope(id: string): Envelope | undefined {
  const found = envelopes.find((envelope) => envelope.id === id);
  return found ? clone(found) : undefined;
}

export function signEnvelope(
  id: string,
  partyId: string,
  signatureName: string,
): Envelope {
  const envelope = envelopes.find((item) => item.id === id);
  if (!envelope) {
    throw Object.assign(new Error("Envelope not found"), { status: 404 });
  }
  if (envelope.status === "voided") {
    throw Object.assign(new Error("Cannot sign a voided envelope"), { status: 409 });
  }
  if (envelope.status === "completed") {
    throw Object.assign(new Error("Envelope is already complete"), { status: 409 });
  }

  const party = envelope.parties.find((item) => item.id === partyId);
  if (!party) {
    throw Object.assign(new Error("Party not found"), { status: 404 });
  }
  if (party.status === "signed") {
    throw Object.assign(new Error("This party already signed"), { status: 409 });
  }

  const signer = envelope.parties.find((item) => item.role === "signer");
  if (party.role === "countersigner" && signer && signer.status !== "signed") {
    throw Object.assign(new Error("Countersign waits for the first signature"), { status: 409 });
  }

  const now = new Date().toISOString();
  party.status = "signed";
  party.signedAt = now;
  envelope.updatedAt = now;
  envelope.audit.push(
    event(
      `s_${now}`,
      now,
      signatureName || party.name,
      party.role === "countersigner" ? "countersigned" : "signed",
      `${party.name} applied a local fixture signature.`,
    ),
  );

  const pending = envelope.parties.some((item) => item.status === "pending");
  envelope.status = pending ? "awaiting_signature" : "completed";
  if (!pending) {
    envelope.audit.push(
      event(`c_${now}`, now, "Lumin Sign Lab", "completed", "All required parties signed."),
    );
  }

  return clone(envelope);
}
