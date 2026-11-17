import type { BBox, GroundTruth, Recipient } from "./types";

export const PAGE_WIDTH = 612;
export const PAGE_HEIGHT = 792;

export const RECIPIENTS: Recipient[] = [
  {
    id: "jordan-hale",
    name: "Jordan Hale",
    email: "jordan.hale@acme-dynamics.example",
    title: "Chief Executive Officer",
    company: "Acme Dynamics LLC",
    role: "signer",
    order: 1,
  },
  {
    id: "priya-shah",
    name: "Priya Shah",
    email: "priya.shah@northwind-labs.example",
    title: "General Counsel",
    company: "Northwind Labs Inc.",
    role: "signer",
    order: 2,
  },
];

/** PDF-space boxes (origin bottom-left, points) for the signature page. */
export interface PdfBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const SIGNATURE_PAGE = 6;

const LEFT_X = 54;
const RIGHT_X = 324;
const BOX_W = 220;
const NAME_H = 22;
const SIG_H = 40;
const DATE_H = 22;
const INIT_H = 22;

export const PDF_FIELDS = {
  "jordan-name": { x: LEFT_X, y: 430, width: BOX_W, height: NAME_H },
  "jordan-signature": { x: LEFT_X, y: 372, width: BOX_W, height: SIG_H },
  "jordan-date": { x: LEFT_X, y: 332, width: 140, height: DATE_H },
  "jordan-initials": { x: LEFT_X, y: 292, width: 72, height: INIT_H },
  "priya-name": { x: RIGHT_X, y: 430, width: BOX_W, height: NAME_H },
  "priya-signature": { x: RIGHT_X, y: 372, width: BOX_W, height: SIG_H },
  "priya-date": { x: RIGHT_X, y: 332, width: 140, height: DATE_H },
  "priya-initials": { x: RIGHT_X, y: 292, width: 72, height: INIT_H },
} as const;

export function pdfBoxToNorm(box: PdfBox): BBox {
  return {
    x: box.x / PAGE_WIDTH,
    y: (PAGE_HEIGHT - box.y - box.height) / PAGE_HEIGHT,
    width: box.width / PAGE_WIDTH,
    height: box.height / PAGE_HEIGHT,
  };
}

export function groundTruthFromLayout(): GroundTruth {
  return {
    document: {
      id: "msa-northwind-acme-2026",
      title: "Master Services Agreement — Northwind Labs × Acme Dynamics",
      pageCount: 6,
      pageSize: { width: PAGE_WIDTH, height: PAGE_HEIGHT, unit: "pt" },
    },
    recipients: RECIPIENTS,
    fields: [
      {
        id: "jordan-name",
        type: "name",
        signerId: "jordan-hale",
        page: SIGNATURE_PAGE,
        bbox: pdfBoxToNorm(PDF_FIELDS["jordan-name"]),
        label: "Printed name — Jordan Hale",
      },
      {
        id: "jordan-signature",
        type: "signature",
        signerId: "jordan-hale",
        page: SIGNATURE_PAGE,
        bbox: pdfBoxToNorm(PDF_FIELDS["jordan-signature"]),
        label: "Signature — Jordan Hale",
      },
      {
        id: "jordan-date",
        type: "date",
        signerId: "jordan-hale",
        page: SIGNATURE_PAGE,
        bbox: pdfBoxToNorm(PDF_FIELDS["jordan-date"]),
        label: "Date — Jordan Hale",
      },
      {
        id: "jordan-initials",
        type: "initials",
        signerId: "jordan-hale",
        page: SIGNATURE_PAGE,
        bbox: pdfBoxToNorm(PDF_FIELDS["jordan-initials"]),
        label: "Initials — Jordan Hale",
      },
      {
        id: "priya-name",
        type: "name",
        signerId: "priya-shah",
        page: SIGNATURE_PAGE,
        bbox: pdfBoxToNorm(PDF_FIELDS["priya-name"]),
        label: "Printed name — Priya Shah",
      },
      {
        id: "priya-signature",
        type: "signature",
        signerId: "priya-shah",
        page: SIGNATURE_PAGE,
        bbox: pdfBoxToNorm(PDF_FIELDS["priya-signature"]),
        label: "Signature — Priya Shah",
      },
      {
        id: "priya-date",
        type: "date",
        signerId: "priya-shah",
        page: SIGNATURE_PAGE,
        bbox: pdfBoxToNorm(PDF_FIELDS["priya-date"]),
        label: "Date — Priya Shah",
      },
      {
        id: "priya-initials",
        type: "initials",
        signerId: "priya-shah",
        page: SIGNATURE_PAGE,
        bbox: pdfBoxToNorm(PDF_FIELDS["priya-initials"]),
        label: "Initials — Priya Shah",
      },
    ],
  };
}
