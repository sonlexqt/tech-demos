import type { CannedQuery } from "../types";

export const cannedQueries: CannedQuery[] = [
  {
    id: "liability-cap",
    label: "Liability cap",
    question: "What is the limitation of liability / liability cap?",
    aliases: [
      "liability cap",
      "limitation of liability",
      "damages cap",
      "12 month fees",
      "twelve months",
      "aggregate liability",
    ],
    steps: [
      {
        node_id: "0031",
        reason:
          "The question is about monetary risk allocation, not services or fees. Article 10 is titled Limitation of Liability.",
      },
      {
        node_id: "0033",
        reason:
          "Article 10 splits disclaimer vs. the operative limitation. Section 10.2 holds the cap and carve-outs.",
      },
      {
        node_id: "0034",
        reason:
          "10.2.1 Cap on Damages states the trailing twelve-month fees aggregate limit.",
      },
    ],
    answer:
      "Except for listed carve-outs, each party’s aggregate liability is capped at the fees paid or payable by Customer to Provider in the twelve (12) months immediately preceding the first claim. Indirect / lost-profits damages are disclaimed. Carve-outs include IP indemnity, confidentiality breach, data-protection incidents caused by Provider’s willful misconduct or gross negligence, fraud, and bodily injury.",
    highlight_node_id: "0034",
  },
  {
    id: "confidentiality-term",
    label: "Confidentiality term",
    question: "How long do confidentiality / NDA obligations last?",
    aliases: [
      "confidentiality",
      "non-disclosure",
      "nda",
      "five years",
      "trade secret",
      "survive",
    ],
    steps: [
      {
        node_id: "0017",
        reason:
          "The query asks about non-disclosure duration. Article 6 is the confidentiality / NDA regime.",
      },
      {
        node_id: "0021",
        reason:
          "Section 6.4 is specifically titled Duration of Confidentiality Obligations.",
      },
    ],
    answer:
      "Confidentiality obligations survive for five (5) years after termination or expiration of the Agreement. Trade Secrets stay protected until they no longer qualify as trade secrets under applicable law. Use is limited to performing the Agreement, with a reasonable-care standard and need-to-know disclosure.",
    highlight_node_id: "0021",
  },
  {
    id: "termination-convenience",
    label: "Termination notice",
    question: "Can we terminate for convenience, and what notice is required?",
    aliases: [
      "termination for convenience",
      "terminate for convenience",
      "ninety days",
      "90 days",
      "notice period",
      "initial term",
    ],
    steps: [
      {
        node_id: "0039",
        reason:
          "Exit rights live in Article 13 (Term and Termination), not in fees or SLAs.",
      },
      {
        node_id: "0041",
        reason: "Section 13.2 distinguishes cause vs. convenience termination.",
      },
      {
        node_id: "0043",
        reason:
          "13.2.2 Termination for Convenience states the 90-day notice and that it is only available after the Initial Term.",
      },
    ],
    answer:
      "After the 36-month Initial Term, either party may terminate for convenience with ninety (90) days’ prior written notice. Convenience exit does not refund prepaid fees. During the Initial Term, convenience termination requires mutual written agreement. For cause: 30-day cure after written notice (or immediate for insolvency).",
    highlight_node_id: "0043",
  },
  {
    id: "data-subprocessors",
    label: "Data & subprocessors",
    question: "Who processes personal data, and how are subprocessors and security handled?",
    aliases: [
      "subprocessor",
      "data processing",
      "dpa",
      "soc 2",
      "aes-256",
      "exhibit e",
      "exhibit d",
      "controller",
    ],
    steps: [
      {
        node_id: "0022",
        reason:
          "Data-protection roles and instructions are in Article 7, which points at Exhibits C–E.",
      },
      {
        node_id: "0025",
        reason:
          "Section 7.3 is the operative Subprocessor clause (Exhibit E list + 30-day notice).",
      },
      {
        node_id: "0054",
        reason:
          "Exhibit E names current subprocessors (AWS, SendGrid, Zendesk, Sentry, Datadog).",
      },
    ],
    answer:
      "Customer is controller and Lumin Sign is processor of Personal Data in Customer Data (Exhibit C DPA). New subprocessors require thirty (30) days’ prior written notice; Customer may object and terminate the affected services. Current list (Exhibit E): AWS (US hosting), SendGrid, Zendesk, Sentry, Datadog. Security (Article 8 / Exhibit D): SOC 2 Type II, AES-256 at rest, TLS 1.2+ in transit, 72-hour incident notice.",
    highlight_node_id: "0025",
  },
  {
    id: "ip-ownership",
    label: "IP ownership",
    question: "Who owns IP in the platform vs. deliverables?",
    aliases: [
      "intellectual property",
      "deliverable",
      "ownership",
      "custom deliverables",
      "platform ip",
      "customer data",
    ],
    steps: [
      {
        node_id: "0013",
        reason:
          "Ownership is allocated in Article 5 (Intellectual Property), not in the SOW alone.",
      },
      {
        node_id: "0015",
        reason:
          "Section 5.2 states Customer owns Customer Data and Custom Deliverables, with a Term license for embedded Platform IP.",
      },
    ],
    answer:
      "Lumin Sign retains the Platform, Documentation, Usage Data, and pre-existing tools (Platform IP). Customer owns Customer Data and Custom Deliverables (assigned on delivery and payment). If Platform IP is embedded in a deliverable, Customer gets a non-exclusive, non-transferable license to use it during the Term with the Services; static exported documents (signed PDFs, office-format playbooks) may be kept after termination.",
    highlight_node_id: "0015",
  },
  {
    id: "governing-law",
    label: "Governing law",
    question: "What is the governing law and dispute venue?",
    aliases: [
      "governing law",
      "venue",
      "delaware",
      "wilmington",
      "arbitration",
      "aaa",
    ],
    steps: [
      {
        node_id: "0045",
        reason:
          "Forum selection is in Article 14 (Governing Law and Disputes).",
      },
      {
        node_id: "0046",
        reason: "14.1 chooses Delaware law and excludes the CISG.",
      },
      {
        node_id: "0047",
        reason:
          "14.2 sets exclusive jurisdiction in the state and federal courts in Wilmington, Delaware.",
      },
    ],
    answer:
      "Delaware law governs, without conflict-of-laws rules; the CISG does not apply. Exclusive venue is the state and federal courts in Wilmington, Delaware (injunctive relief may be sought elsewhere to protect IP/confidentiality). Either party may elect binding AAA Commercial arbitration in Wilmington for claims under $250,000.",
    highlight_node_id: "0047",
  },
];
