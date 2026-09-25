import type { Candidates } from "../src/types";
import { NONE, choiceCriteria } from "./extract";

export const INTENT_CRITERIA = {
  signer_list: "People who should be signers[] on POST /v1/signature_request/send (names, emails, optional group).",
  request_meta:
    "Request-level fields: title, expires_at, signing_type, custom_email, or use_text_tags — not a roster.",
  viewer_list: "People who should be viewers[] only (visibility, deal desk, finance — they do not sign).",
  mixed: "Several SignatureRequestDTO fields mixed with Slack/email chatter.",
  junk: "Unrelated noise (wifi passwords, calendar links, gifs) that must not enter the DTO.",
} as const;

export const PASTE_FIT_LEVELS = [
  "Unrelated junk — do not write any SignatureRequestDTO field.",
  "Weak match — maybe one property, but the clip is noisy.",
  "Good match — one clear DTO field (title, signer, viewer, expiry, or email subject).",
  "Ready to apply — high-quality signer/viewer/meta content for Send Signature Request.",
];

export const TARGET_CRITERIA = {
  title: "Set SignatureRequestDTO.title",
  signer: "Add a row to signers[] (name, email_address, optional group).",
  viewer: "Add a row to viewers[] (name, email_address).",
  expires_at: "Set expires_at as unix epoch milliseconds.",
  signing_type: "Set signing_type to ORDER or SAME_TIME.",
  custom_email: "Fill custom_email.subject_name, title, or sender_email.",
  none: "Do not paste into the DTO.",
} as const;

export function buildQuestions(clipboard: string, candidates: Candidates) {
  const questions: Record<string, object> = {
    intent: {
      type: "choice",
      instructions: {
        question:
          "What is the primary intent of this clipboard text for building a Lumin SignatureRequestDTO (POST /v1/signature_request/send)?",
        dto: "Required: title, signers[], expires_at (ms). Optional: viewers[], signing_type, custom_email, use_text_tags, file_url.",
      },
      criteria: INTENT_CRITERIA,
    },
    paste_fit: {
      type: "score",
      instructions:
        "How well does this clipboard belong on a Send Signature Request payload rather than leftover chat noise?",
      criteria: PASTE_FIT_LEVELS,
    },
    primary_target: {
      type: "choice",
      instructions: "If you apply this clip to exactly one DTO property, which target fits best?",
      criteria: TARGET_CRITERIA,
    },
  };

  if (candidates.emails.length) {
    questions.signer_email = {
      type: "choice",
      instructions: {
        question:
          "Which email should be a signers[] row? Skip cc:, viewer-only, and ignore lines.",
        clipboard,
      },
      criteria: choiceCriteria(candidates.emails),
    };
    questions.viewer_email = {
      type: "choice",
      instructions: {
        question: "Which email should be viewers[] only (deal desk / finance / visibility, not a signer)?",
        clipboard,
      },
      criteria: choiceCriteria(candidates.emails),
    };
  }

  if (candidates.titles.length) {
    questions.title_span = {
      type: "choice",
      instructions: "Which span is SignatureRequestDTO.title?",
      criteria: choiceCriteria(candidates.titles),
    };
  }

  if (candidates.expires.length) {
    questions.expire_span = {
      type: "choice",
      instructions: "Which expiry hint should become expires_at (unix epoch milliseconds)?",
      criteria: choiceCriteria(candidates.expires.map((e) => e.label)),
    };
  }

  if (candidates.signingTypes.length) {
    questions.signing_type = {
      type: "choice",
      instructions: "Which signing_type applies? ORDER means signers[].group starts at 1.",
      criteria: {
        ORDER: "Sequential groups; only group 1 is notified first.",
        SAME_TIME: "Everyone can sign in parallel.",
        none: "Do not set signing_type.",
      },
    };
  }

  if (candidates.subjects.length) {
    questions.subject_span = {
      type: "choice",
      instructions: "Which span is custom_email.subject_name?",
      criteria: choiceCriteria(candidates.subjects),
    };
  }

  return questions;
}

export { NONE };
