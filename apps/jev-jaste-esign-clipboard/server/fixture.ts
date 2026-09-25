import type { Candidates, Intent } from "../src/types";
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
  const signers = candidates.people.filter((p) => p.kind === "signer").length;
  const viewers = candidates.people.filter((p) => p.kind === "viewer").length;
  const meta =
    candidates.titles.length +
    candidates.expires.length +
    candidates.signingTypes.length +
    candidates.subjects.length +
    (candidates.textTags ? 1 : 0);
  const junkOnly = /\b(wifi|hunter2|calendar\.google|ignore the gif)\b/.test(text);
  const kinds = [signers > 0, viewers > 0, meta > 0].filter(Boolean).length;

  return {
    signer_list: signers * 1.5 + (/\b(order|group|counsel|signer)\b/.test(text) ? 0.4 : 0),
    request_meta: meta * 1.3 + (/\b(title should be|expire|email subject|text tags)\b/.test(text) ? 0.6 : 0),
    viewer_list: viewers * 2.2 + (/\bviewer only\b/.test(text) ? 0.8 : 0),
    mixed: kinds >= 2 ? 2.2 + kinds * 0.25 : junkOnly && signers === 1 && meta === 0 ? 1.6 : 0.08,
    junk: junkOnly && kinds === 0 ? 2.4 : junkOnly && kinds === 1 ? 0.35 : 0.1,
  };
}

export function fixtureJudge(clipboard: string, candidates: Candidates): Judgment {
  const weights = guessIntent(clipboard, candidates);
  const probabilities = softmaxLike(weights);
  const intent = Object.entries(probabilities).sort((a, b) => b[1] - a[1])[0]?.[0] as Intent;
  const signer = candidates.people.find((p) => p.kind === "signer");
  const viewer = candidates.people.find((p) => p.kind === "viewer");
  const fit = intent === "junk" ? 0.25 : intent === "mixed" ? 2.2 : 2.7;

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
      confidence: intent === "junk" ? 0.68 : 0.92,
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
          : intent === "viewer_list"
            ? "viewer"
            : intent === "request_meta"
              ? "title"
              : intent === "mixed"
                ? "signer"
                : "none",
      confidence: 0.84,
    },
    signer_email: { type: "choice", choice: signer?.email ?? "none", confidence: signer ? 0.93 : 0.6 },
    viewer_email: { type: "choice", choice: viewer?.email ?? "none", confidence: viewer ? 0.94 : 0.6 },
    title_span: {
      type: "choice",
      choice: candidates.titles[0] ?? "none",
      confidence: candidates.titles.length ? 0.95 : 0.55,
    },
    expire_span: {
      type: "choice",
      choice: candidates.expires[0]?.label ?? "none",
      confidence: candidates.expires.length ? 0.9 : 0.55,
    },
    signing_type: {
      type: "choice",
      choice: candidates.signingTypes[0] ?? "none",
      confidence: candidates.signingTypes.length ? 0.91 : 0.55,
    },
    subject_span: {
      type: "choice",
      choice: candidates.subjects[0] ?? "none",
      confidence: candidates.subjects.length ? 0.9 : 0.55,
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
