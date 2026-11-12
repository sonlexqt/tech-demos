import type { Question } from "./types.ts";

export type AppliesTo = "all" | "msa" | "nda";

export type CheckUi =
  | { kind: "noul_issue" }
  | { kind: "noul_requirement" }
  | { kind: "noul_info" }
  | { kind: "choice"; failValues: string[]; humanValues?: string[] }
  | { kind: "score"; failAbove?: number; failBelow?: number };

export type CheckDef = {
  id: string;
  group: string;
  label: string;
  hint: string;
  appliesTo: AppliesTo;
  ui: CheckUi;
  question: Question;
};

const LAW = {
  california: "California, United States.",
  delaware: "Delaware, United States.",
  new_york: "New York, United States.",
  england_wales: "England and Wales.",
  other: "A named jurisdiction that is not in this list.",
  unspecified: "No governing law, or only a vague pointer such as 'vendor's home jurisdiction'.",
} as const;

const DOC_TYPE = {
  msa: "Master services, professional services, or similar paid services agreement.",
  nda: "Non-disclosure or confidentiality agreement.",
  sow: "Statement of work or project schedule standing alone.",
  dpa: "Data processing addendum or similar privacy processing terms.",
  other: "Any other contract type.",
} as const;

const RENEWAL = {
  none: "Fixed term with no automatic renewal, or the contract is not term-based.",
  with_notice: "Auto-renews only if a party can opt out with a stated notice period.",
  without_notice: "Auto-renews with no opt-out notice period, or the notice is missing.",
  unclear: "Renewal language exists but cannot be classified.",
} as const;

const RISK = [
  "0 — Clean: ready to send; no material drafting gaps.",
  "1 — Minor: small hygiene issues a sender can ignore or fix later.",
  "2 — Material gaps: missing parties, exhibits, or core clauses; do not send blindly.",
  "3 — Do not send: signature blocks, identity, or conflicting terms are broken.",
];

const READINESS = [
  "0 — Not sign-ready: missing signature blocks or party identity.",
  "1 — Major gaps: several send-blocking issues remain.",
  "2 — Minor gaps: send only after a human glances at flagged rows.",
  "3 — Ready to send: signature architecture and core terms look complete.",
];

const COMPLETENESS = [
  "0 — Sparse: large sections or exhibits are missing.",
  "1 — Partial: several expected clauses or fields are absent.",
  "2 — Mostly complete: a few optional terms missing.",
  "3 — Complete for this document type.",
];

export const CHECKS: CheckDef[] = [
  {
    id: "every_party_has_sig_block",
    group: "Signatures",
    label: "Every party has a signature block",
    hint: "Named parties should each have a dedicated signature block before Send.",
    appliesTo: "all",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions: "Does every named party have its own dedicated signature block?",
      criteria: {
        true_description: "Each party listed in the preamble has a signature block with a signature line.",
        false_description: "A named party has no signature block, or only one combined unsigned line for everyone.",
      },
    },
  },
  {
    id: "sig_printed_name_lines",
    group: "Signatures",
    label: "Printed name lines",
    hint: "Blocks should include a printed/typed name line for the signer.",
    appliesTo: "all",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions: "Do the signature blocks include a printed or typed name line for each signer?",
    },
  },
  {
    id: "sig_title_lines",
    group: "Signatures",
    label: "Title / capacity lines",
    hint: "Entity signers need a title or capacity line.",
    appliesTo: "all",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions: "Do the signature blocks include a title or capacity line for each entity signer?",
    },
  },
  {
    id: "sig_date_lines",
    group: "Signatures",
    label: "Date lines next to signatures",
    hint: "A date line next to each block avoids post-send chasing.",
    appliesTo: "all",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions: "Does each signature block include a date line?",
    },
  },
  {
    id: "missing_witness_block",
    group: "Signatures",
    label: "Witness required but missing",
    hint: "If the contract demands a witness or notary, a block must exist.",
    appliesTo: "all",
    ui: { kind: "noul_issue" },
    question: {
      type: "noul",
      instructions:
        "Does the contract require a witness or notary but omit a witness/notary signature block?",
      criteria: {
        true_description: "Witness or notary is required in the text and no matching block is present.",
        false_description: "No witness/notary is required, or a matching block is present.",
      },
    },
  },
  {
    id: "e_sign_permitted",
    group: "Signatures",
    label: "Electronic signatures permitted",
    hint: "Lumin Sign send assumes e-sign is allowed.",
    appliesTo: "all",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions:
        "Does the contract permit electronic signatures (or counterparts / electronic execution)?",
      criteria: {
        true_description: "An electronic signature, electronic execution, or counterparts clause allows e-sign.",
        false_description: "Wet-ink only, or no execution mechanics that allow electronic signing.",
      },
    },
  },
  {
    id: "counterparts_clause",
    group: "Signatures",
    label: "Counterparts clause",
    hint: "Lets parties sign separate copies.",
    appliesTo: "all",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions: "Is there a counterparts clause allowing separate signed copies?",
    },
  },
  {
    id: "empty_date_fields",
    group: "Fields",
    label: "Empty date fields",
    hint: "Blank dates in the body (not the future signature date) block a clean send.",
    appliesTo: "all",
    ui: { kind: "noul_issue" },
    question: {
      type: "noul",
      instructions:
        "Are any date fields in the body left blank (underscores, empty effective date, empty term start)? Ignore signature-date lines that are supposed to be filled at signing.",
      criteria: {
        true_description: "A substantive date in the form body is an underscore, blank, or unfilled placeholder.",
        false_description: "Substantive dates in the body are filled in.",
      },
    },
  },
  {
    id: "empty_initial_fields",
    group: "Fields",
    label: "Empty initial fields",
    hint: "Orphan initial lines confuse signers.",
    appliesTo: "all",
    ui: { kind: "noul_issue" },
    question: {
      type: "noul",
      instructions: "Are there initial-here lines or per-page initial fields left as blanks in the form?",
    },
  },
  {
    id: "missing_effective_date",
    group: "Fields",
    label: "Missing effective date",
    hint: "Send needs a stated effective date or last-date-signed rule.",
    appliesTo: "all",
    ui: { kind: "noul_issue" },
    question: {
      type: "noul",
      instructions:
        "Is the effective date missing (blank, underscore, or not stated at all)?",
    },
  },
  {
    id: "missing_term_duration",
    group: "Fields",
    label: "Missing term duration",
    hint: "Term should be a number of months/years or a stated end date.",
    appliesTo: "all",
    ui: { kind: "noul_issue" },
    question: {
      type: "noul",
      instructions:
        "Is the term / duration missing or left as a vague phrase such as 'as agreed' with no length?",
    },
  },
  {
    id: "missing_counterparty_name",
    group: "Parties",
    label: "Missing counterparty legal name",
    hint: "A role label like 'the Client' is not a legal name.",
    appliesTo: "all",
    ui: { kind: "noul_issue" },
    question: {
      type: "noul",
      instructions:
        "Is a counterparty missing a legal name (blank party line, or only a role such as 'the Client' / 'Disclosing Party' without an entity name)?",
    },
  },
  {
    id: "missing_notice_addresses",
    group: "Parties",
    label: "Missing notice addresses",
    hint: "Each party should have a notice address or email.",
    appliesTo: "all",
    ui: { kind: "noul_issue" },
    question: {
      type: "noul",
      instructions: "Are notice addresses (or notice emails) missing for one or more parties?",
    },
  },
  {
    id: "parties_both_named",
    group: "Parties",
    label: "Both parties named in the preamble",
    hint: "Opening paragraph should name two legal entities (or more, if multi-party).",
    appliesTo: "all",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions:
        "Does the preamble identify at least two parties by legal name (not just a role label)?",
    },
  },
  {
    id: "payment_terms_present",
    group: "Commercial",
    label: "Payment terms present",
    hint: "MSAs need Net-X or similar. Not applicable to NDAs.",
    appliesTo: "msa",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions:
        "If this is a paid services / MSA-style agreement, are payment terms present (Net days, invoice timing, or fees schedule)? If this is an NDA, answer no.",
    },
  },
  {
    id: "late_fee_terms",
    group: "Commercial",
    label: "Late fee terms",
    hint: "Optional but expected on a send-ready MSA.",
    appliesTo: "msa",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions:
        "If this is a services agreement, does it specify late fees or interest on overdue amounts? If this is an NDA, answer no.",
    },
  },
  {
    id: "insurance_requirements",
    group: "Commercial",
    label: "Insurance requirements",
    hint: "Typical MSA hygiene.",
    appliesTo: "msa",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions:
        "If this is a services agreement, does it require insurance (e.g. CGL or professional liability) at a stated limit? If this is an NDA, answer no.",
    },
  },
  {
    id: "auto_renewal_clause",
    group: "Term",
    label: "Auto-renewal clause present",
    hint: "Presence only — renewal_type says whether notice exists.",
    appliesTo: "all",
    ui: { kind: "noul_info" },
    question: {
      type: "noul",
      instructions:
        "Is there an automatic renewal or auto-renew clause (the term extends without a new signature)?",
      criteria: {
        true_description: "The term renews automatically unless a party opts out, or 'auto-renews' is stated.",
        false_description: "Fixed term with no automatic extension, or no term renewal language.",
      },
    },
  },
  {
    id: "confidentiality_clause",
    group: "Protective",
    label: "Confidentiality clause",
    hint: "Expected on both MSA and NDA.",
    appliesTo: "all",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions: "Is there a confidentiality or non-disclosure clause?",
    },
  },
  {
    id: "indemnity_clause",
    group: "Protective",
    label: "Indemnity clause",
    hint: "Expected on an MSA.",
    appliesTo: "msa",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions:
        "If this is a services agreement, is there an indemnification clause? If this is an NDA, answer no unless a true indemnity is present.",
    },
  },
  {
    id: "limitation_of_liability",
    group: "Protective",
    label: "Limitation of liability",
    hint: "Expected on an MSA.",
    appliesTo: "msa",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions:
        "If this is a services agreement, is there a limitation of liability (cap, disclaimer of consequential damages, or similar)? If this is an NDA, answer no unless a cap is present.",
    },
  },
  {
    id: "assignment_without_consent",
    group: "Protective",
    label: "Assignment without consent",
    hint: "Free assignment is a send-time flag.",
    appliesTo: "all",
    ui: { kind: "noul_issue" },
    question: {
      type: "noul",
      instructions:
        "Does a party have the right to assign the agreement without the other party's consent (a free-assignment clause)?",
      criteria: {
        true_description: "Assignment is allowed freely, or 'may assign without consent' is stated.",
        false_description: "Assignment requires consent, is prohibited, or is not addressed as free assignment.",
      },
    },
  },
  {
    id: "ip_ownership_clause",
    group: "Protective",
    label: "IP ownership clause",
    hint: "Expected on an MSA.",
    appliesTo: "msa",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions:
        "If this is a services agreement, is there an intellectual property ownership or work-product clause? If this is an NDA, answer no.",
    },
  },
  {
    id: "force_majeure",
    group: "Boilerplate",
    label: "Force majeure",
    hint: "Standard boilerplate.",
    appliesTo: "all",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions: "Is there a force majeure clause?",
    },
  },
  {
    id: "entire_agreement",
    group: "Boilerplate",
    label: "Entire agreement",
    hint: "Integration clause.",
    appliesTo: "all",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions: "Is there an entire agreement / integration clause?",
    },
  },
  {
    id: "amendment_in_writing",
    group: "Boilerplate",
    label: "Amendments in writing",
    hint: "Stops informal email amendments.",
    appliesTo: "all",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions: "Does the contract require amendments to be in writing and signed?",
    },
  },
  {
    id: "severability",
    group: "Boilerplate",
    label: "Severability",
    hint: "Standard boilerplate.",
    appliesTo: "all",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions: "Is there a severability clause?",
    },
  },
  {
    id: "termination_clause",
    group: "Term",
    label: "Termination clause",
    hint: "Convenience and/or for-cause termination.",
    appliesTo: "all",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions:
        "Is there a termination clause (for convenience, for cause, or a stated end of confidentiality obligations)?",
    },
  },
  {
    id: "referenced_exhibits_missing",
    group: "Exhibits",
    label: "Referenced exhibits missing",
    hint: "A named Exhibit B with no attached exhibit is a classic send miss.",
    appliesTo: "all",
    ui: { kind: "noul_issue" },
    question: {
      type: "noul",
      instructions:
        "Does the contract reference an exhibit, schedule, or attachment that is not actually included (for example Exhibit B or Schedule 1 is named in the body but has no heading/body later)?",
      criteria: {
        true_description: "A referenced exhibit/schedule has no corresponding attached section.",
        false_description: "Every referenced exhibit/schedule appears, or nothing is referenced.",
      },
    },
  },
  {
    id: "governing_law_specified",
    group: "Law",
    label: "Governing law specified",
    hint: "Must name a jurisdiction, not 'vendor's home'.",
    appliesTo: "all",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions: "Is a specific governing-law jurisdiction named?",
    },
  },
  {
    id: "venue_specified",
    group: "Law",
    label: "Venue / forum specified",
    hint: "Courts or arbitration seat.",
    appliesTo: "all",
    ui: { kind: "noul_requirement" },
    question: {
      type: "noul",
      instructions: "Is a venue, forum, or arbitration seat specified?",
    },
  },
  {
    id: "defined_terms_undefined",
    group: "Hygiene",
    label: "Undefined defined terms",
    hint: "Capitalized terms used as definitions without a definitions section.",
    appliesTo: "all",
    ui: { kind: "noul_issue" },
    question: {
      type: "noul",
      instructions:
        "Are capitalized Defined Terms used in the body without being defined (no quoted definition and no definitions section)?",
    },
  },
  {
    id: "conflicting_dates",
    group: "Hygiene",
    label: "Conflicting dates",
    hint: "Header year vs term start mismatch, etc.",
    appliesTo: "all",
    ui: { kind: "noul_issue" },
    question: {
      type: "noul",
      instructions:
        "Do dates in the document conflict (for example the header year disagrees with the stated effective or term-start date)?",
    },
  },
  {
    id: "governing_law",
    group: "Law",
    label: "Governing law",
    hint: "Fixed enum — Decisions choice question.",
    appliesTo: "all",
    ui: { kind: "choice", failValues: ["unspecified"], humanValues: ["other"] },
    question: {
      type: "choice",
      instructions: "Which governing law applies?",
      criteria: { ...LAW },
    },
  },
  {
    id: "document_type",
    group: "Meta",
    label: "Document type",
    hint: "Used in code to skip MSA-only checks on NDAs.",
    appliesTo: "all",
    ui: { kind: "choice", failValues: [] },
    question: {
      type: "choice",
      instructions: "What type of agreement is this?",
      criteria: { ...DOC_TYPE },
    },
  },
  {
    id: "renewal_type",
    group: "Term",
    label: "Renewal type",
    hint: "Auto-renew without notice is a send flag.",
    appliesTo: "all",
    ui: {
      kind: "choice",
      failValues: ["without_notice"],
      humanValues: ["unclear"],
    },
    question: {
      type: "choice",
      instructions: "How does the term renew?",
      criteria: { ...RENEWAL },
    },
  },
  {
    id: "overall_risk",
    group: "Rubric",
    label: "Overall send risk",
    hint: "0–3 weighted score from the Decisions rubric.",
    appliesTo: "all",
    ui: { kind: "score", failAbove: 1.75 },
    question: {
      type: "score",
      instructions:
        "Rate overall risk of sending this document for signature as-is.",
      criteria: RISK,
    },
  },
  {
    id: "sign_readiness",
    group: "Rubric",
    label: "Sign-readiness",
    hint: "0 = not ready, 3 = ready to send.",
    appliesTo: "all",
    ui: { kind: "score", failBelow: 1.5 },
    question: {
      type: "score",
      instructions: "Rate how ready this document is to send for e-signature.",
      criteria: READINESS,
    },
  },
  {
    id: "completeness",
    group: "Rubric",
    label: "Completeness",
    hint: "0–3 for this document type.",
    appliesTo: "all",
    ui: { kind: "score", failBelow: 1.5 },
    question: {
      type: "score",
      instructions: "Rate completeness of this contract for its document type.",
      criteria: COMPLETENESS,
    },
  },
];

export const CONFIDENCE_THRESHOLD = 0.75;

export const QUESTION_MAP: Record<string, Question> = Object.fromEntries(
  CHECKS.map((c) => [c.id, c.question]),
);

export const CHECK_BY_ID: Record<string, CheckDef> = Object.fromEntries(
  CHECKS.map((c) => [c.id, c]),
);

export function questionCount(): number {
  return CHECKS.length;
}
