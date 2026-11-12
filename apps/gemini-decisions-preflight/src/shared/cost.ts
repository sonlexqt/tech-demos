import type { Usage } from "./types.ts";

/** Paid Decisions API: $0.10 / 1M input tokens, $0 output (Nov 2026 launch). */
export const DECISIONS_INPUT_USD_PER_MILLION = 0.1;
export const DECISIONS_OUTPUT_USD_PER_MILLION = 0;

/** Paid Gemini 3.5 Flash-Lite defaults. Read env at call time so `.env` can load first. */
export const DEFAULT_FLASH_INPUT_USD_PER_M = 0.3;
export const DEFAULT_FLASH_OUTPUT_USD_PER_M = 2.5;

export function flashRates(env: NodeJS.ProcessEnv = process.env): {
  inputPerM: number;
  outputPerM: number;
} {
  return {
    inputPerM: Number(env.FLASH_INPUT_USD_PER_M ?? DEFAULT_FLASH_INPUT_USD_PER_M),
    outputPerM: Number(env.FLASH_OUTPUT_USD_PER_M ?? DEFAULT_FLASH_OUTPUT_USD_PER_M),
  };
}

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

export function flashUsd(usage: Usage, env: NodeJS.ProcessEnv = process.env): number {
  const rates = flashRates(env);
  return usdFromUsage(usage, rates.inputPerM, rates.outputPerM);
}

export function formatUsd(n: number): string {
  if (n < 0.0001) return `$${n.toFixed(6)}`;
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

export function estimateTokensFromChars(chars: number): number {
  return Math.max(1, Math.round(chars / 4));
}
