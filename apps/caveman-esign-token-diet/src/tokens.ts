/** Illustrative Sonnet-class list prices. Not a quote and not Caveman's number. */
export const RATES = {
  inputPerMTok: 3,
  outputPerMTok: 15,
  label: "Illustrative $3 / $15 per 1M tokens (Sonnet-class list, not a quote)",
};

/**
 * Reasonable offline estimator for mixed prose + JSON.
 * Blends chars/4 (JSON-ish) with a word heuristic. Deterministic. Not tiktoken.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const chars = text.length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const punct = (text.match(/[{}[\]",:/=<>\\]/g) ?? []).length;
  const byChars = chars / 4;
  const byWords = words * 1.3 + punct * 0.25;
  return Math.max(1, Math.round(byChars * 0.72 + byWords * 0.28));
}

export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return (inputTokens * RATES.inputPerMTok + outputTokens * RATES.outputPerMTok) / 1_000_000;
}

export function formatUsd(amount: number): string {
  if (amount < 0.0001) return `$${amount.toFixed(6)}`;
  if (amount < 0.01) return `$${amount.toFixed(5)}`;
  return `$${amount.toFixed(4)}`;
}
