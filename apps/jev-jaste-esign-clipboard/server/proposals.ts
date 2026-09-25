import type { Candidates, ClassifyResponse, Intent, Proposal, SignerVerification } from "../src/types";
import { NONE } from "./extract";

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
  viewer_email?: ChoiceAnswer;
  title_span?: ChoiceAnswer;
  expire_span?: ChoiceAnswer;
  signing_type?: ChoiceAnswer;
  subject_span?: ChoiceAnswer;
};

const VC: SignerVerification = {
  method: "vc",
  payload: {
    doc_type: "driver_license",
    claims: ["given_name", "family_name"],
  },
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

export function composeProposals(
  _clipboard: string,
  candidates: Candidates,
  judgment: Judgment,
): Proposal[] {
  const intent = (judgment.intent.choice ?? "junk") as Intent;
  const intentP = judgment.intent.probabilities ?? {};
  const fit = typeof judgment.paste_fit.score === "number" ? judgment.paste_fit.score : 0;
  const fitNorm = clamp01(fit / 3);
  const proposals: Proposal[] = [];
  const primary = judgment.primary_target?.choice;

  const push = (proposal: Omit<Proposal, "id">) => {
    if (!proposal.value.trim()) return;
    if (proposals.some((row) => row.target === proposal.target && row.value === proposal.value)) return;
    proposals.push({ ...proposal, id: `${proposal.target}-${proposals.length + 1}` });
  };

  const wantSigners = intent === "signer_list" || intent === "mixed" || primary === "signer";
  const wantViewers = intent === "viewer_list" || intent === "mixed" || primary === "viewer";
  const wantMeta = intent === "request_meta" || intent === "mixed" || primary === "title" || primary === "expires_at" || primary === "signing_type" || primary === "custom_email";

  const signerEmails = new Set<string>();
  if (wantSigners) {
    for (const row of candidates.people.filter((p) => p.kind === "signer")) {
      signerEmails.add(row.email.toLowerCase());
      push({
        target: "signer",
        path: "signers[]",
        label: `signers[]${row.group != null ? ` · group ${row.group}` : ""}`,
        value: row.email,
        name: row.name,
        group: row.group,
        confidence: clamp01(Math.max(intentP.signer_list ?? 0, intentP.mixed ?? 0, 0.74) * Math.max(fitNorm, 0.72)),
        reason:
          row.group != null
            ? `${row.name} → email_address + group ${row.group} (signing_type ORDER).`
            : `${row.name} looks like a signer (name + email_address).`,
      });
      if (row.verify) {
        push({
          target: "verification",
          path: "signers[].verification",
          label: "signers[].verification",
          value: row.email,
          name: row.name,
          group: row.group,
          verification: VC,
          confidence: 0.7,
          reason: "Paste mentioned ID/VC. Requires a Digital Trust workspace license in production.",
        });
      }
    }
    const picked = pick(judgment.signer_email);
    if (picked && !signerEmails.has(picked.toLowerCase())) {
      const named = candidates.people.find((p) => p.email.toLowerCase() === picked.toLowerCase());
      if (!named || named.kind === "signer") {
        push({
          target: "signer",
          path: "signers[]",
          label: "signers[]",
          value: picked,
          name: named?.name,
          group: named?.group,
          confidence: confidence(judgment.signer_email, 0.68),
          reason: "Choice head picked this email among pre-parsed candidates.",
        });
      }
    }
  }

  if (wantViewers) {
    const viewers = candidates.people.filter((p) => p.kind === "viewer");
    for (const row of viewers) {
      push({
        target: "viewer",
        path: "viewers[]",
        label: "viewers[]",
        value: row.email,
        name: row.name,
        confidence: clamp01(Math.max(intentP.viewer_list ?? 0, intentP.mixed ?? 0, 0.8) * 0.95),
        reason: `${row.name} is visibility-only (not a signer).`,
      });
    }
    const picked = pick(judgment.viewer_email);
    if (picked && !viewers.some((v) => v.email.toLowerCase() === picked.toLowerCase())) {
      const named = candidates.people.find((p) => p.email.toLowerCase() === picked.toLowerCase());
      if (named?.kind !== "signer" && named?.kind !== "cc") {
        push({
          target: "viewer",
          path: "viewers[]",
          label: "viewers[]",
          value: picked,
          name: named?.name,
          confidence: confidence(judgment.viewer_email, 0.64),
          reason: "Choice head selected this as viewers[].",
        });
      }
    }
  }

  if (wantMeta) {
    const title = pick(judgment.title_span) ?? candidates.titles[0];
    if (title) {
      push({
        target: "title",
        path: "title",
        label: "title",
        value: title,
        confidence: clamp01(Math.max(intentP.request_meta ?? 0, 0.82) * confidence(judgment.title_span, 0.9)),
        reason: "Extracted request title (1–255 chars).",
      });
    }

    const expireLabel = pick(judgment.expire_span);
    const expire = candidates.expires.find((e) => e.label === expireLabel) ?? candidates.expires[0];
    if (expire) {
      push({
        target: "expires_at",
        path: "expires_at",
        label: "expires_at",
        value: String(expire.ms),
        confidence: 0.86,
        reason: `${expire.label} → unix epoch milliseconds (${expire.ms}).`,
      });
    }

    const signing = pick(judgment.signing_type) ?? candidates.signingTypes[0];
    if (signing === "ORDER" || signing === "SAME_TIME") {
      push({
        target: "signing_type",
        path: "signing_type",
        label: "signing_type",
        value: signing,
        confidence: 0.88,
        reason:
          signing === "ORDER"
            ? "Ordered countersign — signers[].group starts at 1."
            : "Parallel signing (API default).",
      });
    }

    const subject = pick(judgment.subject_span) ?? candidates.subjects[0];
    if (subject) {
      push({
        target: "custom_email.subject_name",
        path: "custom_email.subject_name",
        label: "custom_email.subject_name",
        value: subject,
        confidence: 0.84,
        reason: "Thread asked for a custom signer-email subject.",
      });
    }
    if (candidates.emailTitles[0]) {
      push({
        target: "custom_email.title",
        path: "custom_email.title",
        label: "custom_email.title",
        value: candidates.emailTitles[0],
        confidence: 0.8,
        reason: "Email body title for the signer notification.",
      });
    }
    if (candidates.senderEmails[0]) {
      push({
        target: "custom_email.sender_email",
        path: "custom_email.sender_email",
        label: "custom_email.sender_email",
        value: candidates.senderEmails[0],
        confidence: 0.78,
        reason: "Sender mailbox mentioned in the thread.",
      });
    }
    if (candidates.textTags) {
      push({
        target: "use_text_tags",
        path: "use_text_tags",
        label: "use_text_tags",
        value: "true",
        confidence: 0.77,
        reason: "Clip asked to parse text tags on the PDF.",
      });
    }
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
