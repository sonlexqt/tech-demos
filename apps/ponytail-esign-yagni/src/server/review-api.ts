import {
  FIXTURE_REVIEW,
  OVERBUILT_FILES,
  REVIEW_SYSTEM_PROMPT,
} from "../data/review";
import type { LlmStatus, ReviewFinding, ReviewResult, ReviewTag } from "../types";

const TAGS: ReviewTag[] = ["delete", "stdlib", "native", "yagni", "shrink"];

export function detectProvider(): LlmStatus {
  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    return { live: true, provider: "anthropic" };
  }
  if (process.env.OPENAI_API_KEY?.trim()) {
    return { live: true, provider: "openai" };
  }
  return { live: false, provider: null };
}

export async function runReview(): Promise<ReviewResult> {
  const status = detectProvider();
  if (!status.live || !status.provider) return FIXTURE_REVIEW;

  try {
    const text =
      status.provider === "anthropic"
        ? await callAnthropic()
        : await callOpenAi();
    const parsed = parseReview(text);
    if (!parsed.findings.length) return FIXTURE_REVIEW;
    return {
      source: "live",
      provider: status.provider,
      findings: parsed.findings,
      netLines: parsed.netLines,
      leanAlready: parsed.leanAlready,
    };
  } catch {
    return FIXTURE_REVIEW;
  }
}

function overbuiltPrompt(): string {
  return OVERBUILT_FILES.map((file) => `--- ${file.path}\n${file.code}`).join(
    "\n\n",
  );
}

async function callAnthropic(): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: REVIEW_SYSTEM_PROMPT,
      messages: [{ role: "user", content: overbuiltPrompt() }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}`);
  const data = (await res.json()) as { content?: { text?: string }[] };
  return data.content?.map((part) => part.text ?? "").join("\n") ?? "";
}

async function callOpenAi(): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0,
      messages: [
        { role: "system", content: REVIEW_SYSTEM_PROMPT },
        { role: "user", content: overbuiltPrompt() },
      ],
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

function parseReview(text: string): {
  findings: ReviewFinding[];
  netLines: number;
  leanAlready: boolean;
} {
  if (/lean already/i.test(text) && !TAGS.some((tag) => text.includes(`${tag}:`))) {
    return { findings: [], netLines: 0, leanAlready: true };
  }

  const findings: ReviewFinding[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const match = line.match(
      /^(?:[-*]\s*)?([A-Za-z0-9_./:-]+):\s*(delete|stdlib|native|yagni|shrink):\s*(.+)$/i,
    );
    if (!match) continue;
    findings.push({
      location: match[1],
      tag: match[2].toLowerCase() as ReviewTag,
      text: match[3].trim(),
    });
  }

  const net = text.match(/net:\s*(-?\d+)/i);
  const netLines = net ? Number(net[1]) : -findings.length * 10;
  return { findings, netLines, leanAlready: false };
}
