import type { WorkspaceItem } from "./types";

export const NOW = new Date("2026-09-28T12:00:00.000Z");

export const FIXTURE_ITEMS: readonly WorkspaceItem[] = [
  {
    id: "q3-board-deck",
    title: "Q3 Board Deck.pdf",
    kind: "pdf",
    subtitle: "Downloaded today · PDF",
    tags: ["pdf", "board"],
    modifiedAt: "2026-09-27T18:00:00.000Z",
    downloadedAt: "2026-09-28T10:15:00.000Z",
  },
  {
    id: "vendor-invoice",
    title: "Vendor Invoice — Acme.pdf",
    kind: "pdf",
    subtitle: "Downloaded 8 days ago · PDF",
    tags: ["pdf", "invoice"],
    modifiedAt: "2026-09-20T16:10:00.000Z",
    downloadedAt: "2026-09-20T16:00:00.000Z",
  },
  {
    id: "office-lease",
    title: "Office Lease 2024.pdf",
    kind: "pdf",
    subtitle: "PDF · lease",
    tags: ["pdf", "lease"],
    modifiedAt: "2026-08-01T12:00:00.000Z",
  },
  {
    id: "brand-guidelines",
    title: "Brand Guidelines.pdf",
    kind: "pdf",
    subtitle: "PDF · brand",
    tags: ["pdf", "brand"],
    modifiedAt: "2026-07-04T09:30:00.000Z",
    downloadedAt: "2026-07-04T09:00:00.000Z",
  },
  {
    id: "nda-acme",
    title: "NDA — Acme Corp",
    kind: "doc",
    subtitle: "Workspace document",
    tags: ["nda", "legal"],
    modifiedAt: "2026-09-18T09:00:00.000Z",
  },
  {
    id: "offer-letter",
    title: "Offer Letter — Rivera",
    kind: "doc",
    subtitle: "HR document",
    tags: ["hr"],
    modifiedAt: "2026-09-12T15:00:00.000Z",
  },
  {
    id: "security-policy",
    title: "Security Policy v3",
    kind: "doc",
    subtitle: "Workspace document",
    tags: ["security"],
    modifiedAt: "2026-06-02T11:00:00.000Z",
  },
  {
    id: "msa-northwind",
    title: "MSA — Northwind",
    kind: "signature_request",
    subtitle: "Awaiting countersign · MSA",
    tags: ["msa", "signature"],
    modifiedAt: "2026-09-25T10:00:00.000Z",
    signature: { status: "countersign", documentType: "MSA" },
  },
  {
    id: "msa-globex",
    title: "MSA — Globex (draft)",
    kind: "signature_request",
    subtitle: "Draft · MSA",
    tags: ["msa", "signature"],
    modifiedAt: "2026-09-22T10:00:00.000Z",
    signature: { status: "draft", documentType: "MSA" },
  },
  {
    id: "sow-legal-wait",
    title: "SOW — Contoso",
    kind: "signature_request",
    subtitle: "Waiting on legal",
    tags: ["sow", "signature"],
    modifiedAt: "2026-09-26T14:00:00.000Z",
    signature: { status: "waiting", waitingOn: "legal" },
  },
  {
    id: "dpa-legal-wait",
    title: "DPA — Contoso",
    kind: "signature_request",
    subtitle: "Waiting on legal",
    tags: ["dpa", "signature"],
    modifiedAt: "2026-09-24T11:00:00.000Z",
    signature: { status: "waiting", waitingOn: "legal" },
  },
  {
    id: "expired-nda",
    title: "NDA — Expired countersign",
    kind: "signature_request",
    subtitle: "Expired signature request",
    tags: ["nda", "signature"],
    modifiedAt: "2026-09-10T08:00:00.000Z",
    signature: { status: "expired", expiresAt: "2026-09-01T00:00:00.000Z" },
  },
  {
    id: "expired-order",
    title: "Order Form — Lapsed",
    kind: "signature_request",
    subtitle: "Expired signature request",
    tags: ["order", "signature"],
    modifiedAt: "2026-08-16T08:00:00.000Z",
    signature: { status: "expired", expiresAt: "2026-08-15T00:00:00.000Z" },
  },
  {
    id: "signed-pilot",
    title: "Pilot Agreement — Done",
    kind: "signature_request",
    subtitle: "Completed",
    tags: ["pilot", "signature"],
    modifiedAt: "2026-09-08T13:00:00.000Z",
    signature: { status: "completed" },
  },
  {
    id: "templates-folder",
    title: "Templates",
    kind: "folder",
    subtitle: "Folder",
    tags: ["folder"],
    modifiedAt: "2026-05-01T12:00:00.000Z",
  },
  {
    id: "msa-template",
    title: "MSA template",
    kind: "template",
    subtitle: "Template",
    tags: ["msa", "template"],
    modifiedAt: "2026-09-15T12:00:00.000Z",
  },
];

export function findFixture(id: string): WorkspaceItem {
  const item = FIXTURE_ITEMS.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`Unknown fixture id: ${id}`);
  }
  return item;
}
