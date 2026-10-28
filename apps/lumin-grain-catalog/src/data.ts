export type ItemDept = "SIGN" | "EDIT" | "IDENTITY" | "DISCOVER" | "REVIEW" | "TRUST";

export type CatalogItem = {
  slug: string;
  index: string;
  title: string;
  dek: string;
  dept: ItemDept;
  duration: string;
  still: string;
  body: string[];
};

export const items: CatalogItem[] = [
  {
    slug: "sign-request",
    index: "01",
    title: "Sign Request",
    dek: "The outbound choreography of a Lumin Sign envelope.",
    dept: "SIGN",
    duration: "04:12",
    still: "sign",
    body: [
      "A request is not a dump of fields. It is a sequence: who sees the document, in what order, and what happens when someone waits.",
      "This study treats the Lumin Sign request flow as a short film — recipient order, reminder cadence, and the quiet moment when the last signer closes the loop.",
    ],
  },
  {
    slug: "msa-countersign",
    index: "02",
    title: "MSA Countersign",
    dek: "Two parties, one master agreement, sequential ink.",
    dept: "SIGN",
    duration: "06:40",
    still: "msa",
    body: [
      "Master service agreements rarely travel alone. One side signs, the other countersigns, and the packet must stay whole.",
      "The catalog frames countersign as a two-shot: facing pages, mirrored seals, and a lock that only sets when both pens have landed.",
    ],
  },
  {
    slug: "quiet-redaction",
    index: "03",
    title: "Quiet Redaction",
    dek: "Irreversible bars. Nothing left under the ink.",
    dept: "EDIT",
    duration: "03:05",
    still: "redact",
    body: [
      "Redaction is a promise: the words are gone, not merely painted over. Boxes become burns.",
      "This still is a page of measured silence — bars of equal weight, a leftover date, and the knowledge that export will not resurrect what was removed.",
    ],
  },
  {
    slug: "lumin-id",
    index: "04",
    title: "Lumin ID",
    dek: "Credentials that travel with the signer, not the PDF.",
    dept: "IDENTITY",
    duration: "05:18",
    still: "id",
    body: [
      "Lumin ID is treated here as a wallet of quiet proofs: a verified person, a trusted device, a credential that can be shown without reprinting a passport into the margin.",
      "The geometry is a badge, not a portrait — concentric trust rings, a serial, and room for a name that is earned rather than typed.",
    ],
  },
  {
    slug: "clause-search",
    index: "05",
    title: "Clause Search",
    dek: "Find the sentence that actually binds.",
    dept: "DISCOVER",
    duration: "07:22",
    still: "clause",
    body: [
      "Agreements hide their teeth in familiar paragraphs. Clause search is a lamp moved across the stack: indemnify, terminate, assign, notice.",
      "Hits are not a spreadsheet. They are lines of type lifting off the page, with enough context to decide whether this is the clause you meant.",
    ],
  },
  {
    slug: "markup-chamber",
    index: "06",
    title: "Markup Chamber",
    dek: "A shared room of comments, pinned to the ink.",
    dept: "REVIEW",
    duration: "08:01",
    still: "markup",
    body: [
      "Review is social and spatial. Threads live next to the sentence they argue with, not in a sidecar no one opens.",
      "The chamber is a page with floating chips — who spoke, whether it is resolved, and the faint grain of a document that has been lived in.",
    ],
  },
  {
    slug: "audit-ribbon",
    index: "07",
    title: "Audit Ribbon",
    dek: "Every signature event, in the order it happened.",
    dept: "TRUST",
    duration: "02:54",
    still: "audit",
    body: [
      "Trust is a timeline, not a stamp. Sent, viewed, signed, declined, completed — each tick is a fact that should outlive the UI that showed it.",
      "The ribbon runs down the still like a film edge: time codes, actor, action. Nothing cinematic except the honesty of sequence.",
    ],
  },
  {
    slug: "form-lattice",
    index: "08",
    title: "Form Lattice",
    dek: "Structured fields laid over a freeform page.",
    dept: "EDIT",
    duration: "04:47",
    still: "form",
    body: [
      "A PDF arrives as a picture of a form. The lattice is the work of making it answerable: name, date, amount, initials.",
      "Boxes align to an invisible grid. Tab order is a path. When the lattice is right, filling a packet feels like walking rooms that were already measured.",
    ],
  },
];

export function itemBySlug(slug: string): CatalogItem | undefined {
  return items.find((item) => item.slug === slug);
}
