import type { Usage } from "./types.ts";

/** Paid Decisions API: $0.10 / 1M input tokens, $0 output (Nov 2026 launch). */
export const DECISIONS_INPUT_USD_PER_MILLION = 0.1;
export const DECISIONS_OUTPUT_USD_PER_MILLION = 0;

/**
 * Paid Gemini 3.5 Flash-Lite rates (the committed live baseline):
 * $0.30 input / $2.50 output per 1M. Override if GENERATIVE_MODEL changes.
 */
export const FLASH_INPUT_USD_PER_MILLION = Number(
  process.env.FLASH_INPUT_USD_PER_M ?? 0.3,
);
export const FLASH_OUTPUT_USD_PER_MILLION = Number(
  process.env.FLASH_OUTPUT_USD_PER_M ?? 2.5,
);

export function usdFromUsage(
  usage: Usage,
  inputPerM: number,
  outputPerM: number,
): number {
  const input = (usage.total_input_tokens / 1_000_000) * inputPerM;
  const output = (usage.total_output_tokens / 1_000_000) * outputPerM;
  return input + output;
}

export function decisionsUsd(usage: Usage): number {
  return usdFromUsage(
    usage,
    DECISIONS_INPUT_USD_PER_MILLION,
    DECISIONS_OUTPUT_USD_PER_MILLION,
  );
}

export function flashUsd(usage: Usage): number {
  return usdFromUsage(usage, FLASH_INPUT_USD_PER_MILLION, FLASH_OUTPUT_USD_PER_MILLION);
}

export function formatUsd(n: number): string {
  if (n < 0.0001) return `$${n.toFixed(6)}`;
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

export function estimateTokensFromChars(chars: number): number {
  return Math.max(1, Math.round(chars / 4));
}
