export const ENVELOPE_ID = "ENV-MSA-2026-441";
export const VENDOR = "Northwind Labs, Inc.";
export const CUSTOMER = "Contoso Analytics LLC";
export const SIGNER_NAME = "Alex Rivera, VP Finance (Contoso)";

export const CONTRACT_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "1. Parties",
    body: `This MSA is between ${VENDOR} ("Vendor") and ${CUSTOMER} ("Customer"). Fictional Lumin Sign fixture; not a real legal instrument.`,
  },
  {
    heading: "2. Services",
    body: "Vendor provides the hosted analytics platform and optional add-ons in Exhibit A. No production Lumin, PandaDoc, or DocuSign APIs are used.",
  },
  {
    heading: "3. Fees",
    body: "Live Univer formulas in Exhibit A. Volume discount: 20 seats -> 10%, 50 -> 18%, 100 -> 25%. Tax 8.5% after discount. Only green input cells are editable.",
  },
  {
    heading: "4. Term and signature",
    body: `Term equals Exhibit A "Term (years)". By clicking Sign, ${SIGNER_NAME} accepts the displayed totals. The envelope binds a Univer snapshot to a pdf-lib PDF via SHA-256.`,
  },
];
