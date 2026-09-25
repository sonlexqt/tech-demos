import type { Candidates, Intent } from "../src/types";
import { isBillingEmail, isCcEmail } from "./extract";
import { INTENT_CRITERIA } from "./questions";
import { composeProposals, type Judgment } from "./proposals";

function softmaxLike(weights: Record<string, number>): Record<string, number> {
  const keys = Object.keys(INTENT_CRITERIA);
  const raw = keys.map((key) => Math.max(0.02, weights[key] ?? 0.04));
  const sum = raw.reduce((a, b) => a + b, 0);
  const probabilities: Record<string, number> = {};
  keys.forEach((key, i) => {
    probabilities[key] = Math.round((raw[i] / sum) * 1000) / 1000;
  });
  return probabilities;
}

function concentratedConfidence(probabilities: Record<string, number>) {
  const values = Object.values(probabilities);
  const max = Math.max(...values);
  const rest = values.filter((v) => v !== max);
  const second = rest.length ? Math.max(...rest) : 0;
  return Math.round(Math.max(0.35, Math.min(0.99, max - second + 0.55)) * 100) / 100;
}

function guessIntent(clipboard: string, candidates: Candidates): Record<string, number> {
  const text = clipboard.toLowerCase();
  const signerSignal = candidates.signers.length * 1.4 + (/\bsigner\b/.test(text) ? 0.6 : 0);
  const addressSignal = candidates.addresses.length * 1.5 + (/\b(hq|notice address|suite)\b/.test(text) ? 0.4 : 0);
  const clauseSignal = candidates.clauses.length * 1.6;
  const emailOnly =
    candidates.emails.length >= 1 &&
    candidates.signers.length === 0 &&
    candidates.addresses.length === 0 &&
    candidates.clauses.length === 0;
  const distinctKinds = [
    candidates.signers.length > 0,
    candidates.addresses.length > 0,
    candidates.clauses.length > 0,
    emailOnly || (candidates.emails.length > candidates.signers.length && /\b(billing|notice email|counterparty)\b/.test(text)),
  ].filter(Boolean).length;

  return {
    signer_list: signerSignal + (/\b(envelope|add these|needs to sign)\b/.test(text) ? 0.5 : 0),
    address_block: addressSignal,
    email_field: emailOnly ? 2.2 : /\b(notice email|counterparty notice|billing email)\b/.test(text) ? 1.1 : 0.1,
    clause: clauseSignal,
    mixed: distinctKinds >= 2 ? 2.4 + distinctKinds * 0.3 : 0.08,
    junk: /\b(wifi password|hunter2|ignore the gif)\b/.test(text) && distinctKinds === 0 ? 2 : 0.12,
  };
}

function pickBest(candidates: string[], fallback?: string | null) {
  return candidates[0] ?? fallback ?? "none";
}

export function fixtureJudge(clipboard: string, candidates: Candidates): Judgment {
  const weights = guessIntent(clipboard, candidates);
  const probabilities = softmaxLike(weights);
  const intent = Object.entries(probabilities).sort((a, b) => b[1] - a[1])[0]?.[0] as Intent;

  const signerEmail =
    candidates.signers.find((s) => !isCcEmail(clipboard, s.email))?.email ??
    candidates.emails.find((e) => !isCcEmail(clipboard, e) && !isBillingEmail(clipboard, e)) ??
    "none";
  const noticeEmail =
    candidates.emails.find((e) => isBillingEmail(clipboard, e) || /harborlegal|contracts\+|accounts@/i.test(e)) ??
    (intent === "email_field" ? candidates.emails[0] : "none");

  const fit =
    intent === "junk" ? 0.2 : intent === "mixed" ? 2.35 : intent === "email_field" ? 2.1 : 2.75;

  return {
    intent: {
      type: "choice",
      choice: intent,
      probabilities,
      confidence: concentratedConfidence(probabilities),
    },
    paste_fit: {
      type: "score",
      score: fit,
      confidence: intent === "junk" ? 0.7 : 0.91,
      probabilities: {
        "0": fit < 0.8 ? 0.7 : 0.02,
        "1": fit >= 0.8 && fit < 1.6 ? 0.7 : 0.06,
        "2": fit >= 1.6 && fit < 2.4 ? 0.72 : 0.12,
        "3": fit >= 2.4 ? 0.8 : 0.1,
      },
    },
    primary_target: {
      type: "choice",
      choice:
        intent === "signer_list"
          ? "signer"
          : intent === "address_block"
            ? "address"
            : intent === "email_field"
              ? "email"
              : intent === "clause"
                ? "clause"
                : intent === "mixed"
                  ? "signer"
                  : "none",
      confidence: 0.84,
    },
    signer_email: {
      type: "choice",
      choice: signerEmail,
      confidence: signerEmail === "none" ? 0.7 : 0.93,
    },
    notice_email: {
      type: "choice",
      choice: noticeEmail ?? "none",
      confidence: noticeEmail && noticeEmail !== "none" ? 0.9 : 0.62,
    },
    company_span: {
      type: "choice",
      choice: pickBest(candidates.companies, "none"),
      confidence: candidates.companies.length ? 0.94 : 0.6,
    },
    address_span: {
      type: "choice",
      choice: pickBest(candidates.addresses, "none"),
      confidence: candidates.addresses.length ? 0.95 : 0.6,
    },
    clause_span: {
      type: "choice",
      choice: pickBest(candidates.clauses, "none"),
      confidence: candidates.clauses.length ? 0.96 : 0.6,
    },
  };
}

export function fixtureClassify(clipboard: string, candidates: Candidates) {
  const started = Date.now();
  const judgment = fixtureJudge(clipboard, candidates);
  return {
    judgment,
    proposals: composeProposals(clipboard, candidates, judgment),
    latency_ms: Date.now() - started,
  };
}
