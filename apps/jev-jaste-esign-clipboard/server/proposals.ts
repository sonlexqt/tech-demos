import type { Candidates, ClassifyResponse, Intent, Proposal } from "../src/types";
import { isBillingEmail, isCcEmail } from "./extract";
import { NONE } from "./questions";

type ChoiceAnswer = {
  type?: string;
  choice?: string;
  probabilities?: Record<string, number>;
  confidence?: number;
};

type ScoreAnswer = {
  type?: string;
  score?: number;
  probabilities?: Record<string, number>;
  confidence?: number;
};

export type Judgment = {
  intent: ChoiceAnswer;
  paste_fit: ScoreAnswer;
  primary_target?: ChoiceAnswer;
  signer_email?: ChoiceAnswer;
  notice_email?: ChoiceAnswer;
  company_span?: ChoiceAnswer;
  address_span?: ChoiceAnswer;
  clause_span?: ChoiceAnswer;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function pick(answer: ChoiceAnswer | undefined): string | null {
  const choice = answer?.choice?.trim();
  if (!choice || choice === NONE) return null;
  return choice;
}

function confidence(answer: ChoiceAnswer | ScoreAnswer | undefined, fallback: number) {
  const value = answer?.confidence;
  return typeof value === "number" && Number.isFinite(value) ? clamp01(value) : fallback;
}

function nameForEmail(candidates: Candidates, email: string) {
  return candidates.signers.find((s) => s.email.toLowerCase() === email.toLowerCase())?.name;
}

export function composeProposals(
  clipboard: string,
  candidates: Candidates,
  judgment: Judgment,
): Proposal[] {
  const intent = (judgment.intent.choice ?? "junk") as Intent;
  const intentP = judgment.intent.probabilities ?? {};
  const fit = typeof judgment.paste_fit.score === "number" ? judgment.paste_fit.score : 0;
  const fitNorm = clamp01(fit / 3);
  const proposals: Proposal[] = [];

  const push = (proposal: Omit<Proposal, "id">) => {
    if (!proposal.value.trim()) return;
    if (proposals.some((row) => row.target === proposal.target && row.value === proposal.value)) {
      return;
    }
    proposals.push({ ...proposal, id: `${proposal.target}-${proposals.length + 1}` });
  };

  const signerEmails = new Set<string>();
  const named = candidates.signers.filter((s) => !isCcEmail(clipboard, s.email));
  const pickedSigner = pick(judgment.signer_email);

  if (intent === "signer_list" || intent === "mixed" || judgment.primary_target?.choice === "signer") {
    for (const row of named) {
      signerEmails.add(row.email.toLowerCase());
      push({
        target: "signer",
        label: "Signer chip",
        value: row.email,
        name: row.name,
        role: "signer",
        confidence: clamp01(
          Math.max(intentP.signer_list ?? 0, intentP.mixed ?? 0, 0.72) *
            Math.max(fitNorm, 0.75) *
            confidence(judgment.signer_email, 0.9),
        ),
        reason: `Named person ${row.name} looks like an envelope signer.`,
      });
    }
    if (pickedSigner && !signerEmails.has(pickedSigner.toLowerCase()) && !isCcEmail(clipboard, pickedSigner)) {
      signerEmails.add(pickedSigner.toLowerCase());
      push({
        target: "signer",
        label: "Signer chip",
        value: pickedSigner,
        name: nameForEmail(candidates, pickedSigner),
        role: "signer",
        confidence: confidence(judgment.signer_email, 0.7) * Math.max(fitNorm, 0.65),
        reason: "Choice head picked this email as a signer among pre-parsed candidates.",
      });
    }
  }

  const notice = pick(judgment.notice_email);
  if (
    notice &&
    !signerEmails.has(notice.toLowerCase()) &&
    (intent === "email_field" ||
      intent === "mixed" ||
      intent === "address_block" ||
      isBillingEmail(clipboard, notice) ||
      judgment.primary_target?.choice === "email")
  ) {
    push({
      target: "email",
      label: "Notice email",
      value: notice,
      confidence: clamp01(
        Math.max(intentP.email_field ?? 0, intentP.mixed ?? 0, 0.6) *
          confidence(judgment.notice_email, 0.8),
      ),
      reason: isBillingEmail(clipboard, notice)
        ? "Looks like a billing / notice mailbox, not a person who signs."
        : "Choice head selected this as the notice / routing email.",
    });
  } else if (intent === "email_field" && candidates.emails[0]) {
    const only = candidates.emails.find((e) => !/gmail\.com$/i.test(e)) ?? candidates.emails[0];
    if (!signerEmails.has(only.toLowerCase())) {
      push({
        target: "email",
        label: "Notice email",
        value: only,
        confidence: clamp01((intentP.email_field ?? 0.8) * Math.max(fitNorm, 0.7)),
        reason: "Clipboard is a single notice mailbox.",
      });
    }
  }

  const company = pick(judgment.company_span) ?? (intent === "address_block" ? candidates.companies[0] : undefined);
  if (company && (intent === "address_block" || intent === "mixed" || judgment.primary_target?.choice === "company")) {
    push({
      target: "company",
      label: "Company / legal name",
      value: company,
      confidence: clamp01(
        Math.max(intentP.address_block ?? 0, intentP.mixed ?? 0, 0.7) *
          confidence(judgment.company_span, 0.85),
      ),
      reason: "Legal-entity span extracted from the clipboard.",
    });
  }

  const address = pick(judgment.address_span) ?? (intent !== "junk" ? candidates.addresses[0] : undefined);
  if (address && (intent === "address_block" || intent === "mixed" || judgment.primary_target?.choice === "address")) {
    push({
      target: "address",
      label: "Notice address",
      value: address,
      confidence: clamp01(
        Math.max(intentP.address_block ?? 0, intentP.mixed ?? 0, 0.74) *
          confidence(judgment.address_span, 0.88),
      ),
      reason: "Street + city/ZIP block matched a notice-address target.",
    });
  }

  const clause = pick(judgment.clause_span) ?? (intent === "clause" || intent === "mixed" ? candidates.clauses[0] : undefined);
  if (clause && (intent === "clause" || intent === "mixed" || judgment.primary_target?.choice === "clause")) {
    push({
      target: "clause",
      label: "Clause block",
      value: clause,
      confidence: clamp01(
        Math.max(intentP.clause ?? 0, intentP.mixed ?? 0, 0.78) * confidence(judgment.clause_span, 0.9),
      ),
      reason: "Legal paragraph selected for the document clause field.",
    });
  }

  return proposals
    .map((row) => ({ ...row, confidence: Math.round(row.confidence * 100) / 100 }))
    .sort((a, b) => b.confidence - a.confidence);
}

export function emptyClassify(partial: Partial<ClassifyResponse>): ClassifyResponse {
  return {
    mode: "fixture",
    provider: null,
    latency_ms: 0,
    intent: "junk",
    intent_probabilities: {},
    intent_confidence: 0,
    fit_score: 0,
    fit_confidence: 0,
    proposals: [],
    ...partial,
  };
}
