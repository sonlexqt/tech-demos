import type { Candidates } from "../src/types";
import { NONE, choiceCriteria } from "./extract";

export const INTENT_CRITERIA = {
  signer_list: "A list of people who should be added as envelope signers (names and emails).",
  address_block: "A mailing or notice address the workspace should store.",
  email_field: "A single notice / counterparty email, not a signer roster.",
  clause: "A legal clause or contract paragraph to drop into the document.",
  mixed: "Several of the above mixed together with chatter.",
  junk: "Unrelated noise that should not fill e-sign fields (passwords, gifs, small talk).",
} as const;

export const PASTE_FIT_LEVELS = [
  "Unrelated junk — do not apply anything to the workspace.",
  "Weak match — maybe one field, but the clip is noisy or incomplete.",
  "Good match — one clear paste target with usable text.",
  "Ready to apply — high-quality signer, address, email, or clause content.",
];

export const TARGET_CRITERIA = {
  signer: "Add one or more people as signer chips on the envelope.",
  company: "Fill the counterparty / legal entity name.",
  address: "Fill the notice or headquarters address field.",
  email: "Fill the notice / routing email field (not a signer chip).",
  clause: "Replace the clause block with the legal paragraph.",
  none: "Do not paste into any workspace field.",
} as const;

export function buildQuestions(clipboard: string, candidates: Candidates) {
  const questions: Record<string, object> = {
    intent: {
      type: "choice",
      instructions: {
        question:
          "What is the primary intent of this messy clipboard text for a Lumin Sign document workspace?",
        workspace:
          "Targets are signer chips, company/legal name, notice address, notice email, and a clause block.",
      },
      criteria: INTENT_CRITERIA,
    },
    paste_fit: {
      type: "score",
      instructions:
        "How well does this clipboard belong in an e-sign workspace (signers, address, email, or clause) rather than leftover chat noise?",
      criteria: PASTE_FIT_LEVELS,
    },
    primary_target: {
      type: "choice",
      instructions:
        "If you had to apply this clip to exactly one workspace field, which target fits best?",
      criteria: TARGET_CRITERIA,
    },
  };

  if (candidates.emails.length) {
    questions.signer_email = {
      type: "choice",
      instructions: {
        question:
          "Which email should be added as a signer chip? Prefer named people who are asked to sign. Skip cc:, billing, and 'do not add' lines.",
        clipboard,
      },
      criteria: choiceCriteria(candidates.emails),
    };
    questions.notice_email = {
      type: "choice",
      instructions: {
        question:
          "Which email is the notice / counterparty / billing mailbox (a field, not a signer)? Choose none if every address is a person who should sign.",
        clipboard,
      },
      criteria: choiceCriteria(candidates.emails),
    };
  }

  if (candidates.companies.length) {
    questions.company_span = {
      type: "choice",
      instructions: "Which span is the legal entity / company name to store on the envelope?",
      criteria: choiceCriteria(candidates.companies),
    };
  }

  if (candidates.addresses.length) {
    questions.address_span = {
      type: "choice",
      instructions: "Which span is the notice or headquarters mailing address?",
      criteria: choiceCriteria(candidates.addresses),
    };
  }

  if (candidates.clauses.length) {
    questions.clause_span = {
      type: "choice",
      instructions: "Which paragraph is the legal clause to paste into the document clause block?",
      criteria: choiceCriteria(candidates.clauses),
    };
  }

  return questions;
}

export { NONE };
