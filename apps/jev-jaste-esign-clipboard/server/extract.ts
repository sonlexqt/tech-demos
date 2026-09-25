import type { Candidates } from "../src/types";

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const NAME_EMAIL_ANGLE =
  /([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)+)\s*<([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})>/g;
const NAME_THEN_EMAIL =
  /([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)+)\s*[—–\-:,]\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const NAME_SPACE_EMAIL =
  /([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)+)\s+([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const COMPANY_RE =
  /\b([A-Z][A-Za-z0-9&.' ]{1,60},?\s*(?:Inc\.|LLC|Ltd\.|LLP|Corp\.|Corporation|Company))(?=\s|$|[^A-Za-z])/g;
const STREET_RE =
  /\b\d{1,5}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,6}\s+(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Ln\.?|Way|Court|Ct\.?|Place|Pl\.?|Pier)\b/i;
const CITY_ZIP_RE = /\b[A-Z][a-zA-Z .]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/;
const LEGAL_HINT =
  /\b(indemnif|liable|liability|hereby|shall|agreement|consequential|hold harmless|party|damages|confidential)\b/i;

const CC_HINT = /\b(cc:|don't add as signer|do not add as signer|pls don't add)\b/i;
const BILLING_HINT = /\b(billing|accounts@|noreply|wifi|password|hunter2)\b/i;
const NONE = "none";

function unique(values: string[], flatten = true): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = (flatten ? raw.replace(/\s+/g, " ") : raw.replace(/[ \t]+/g, " ")).trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function emailsIn(text: string): string[] {
  return unique(text.match(EMAIL_RE) ?? []);
}

function signersIn(text: string): Array<{ name: string; email: string }> {
  const found: Array<{ name: string; email: string }> = [];
  const patterns = [NAME_EMAIL_ANGLE, NAME_THEN_EMAIL, NAME_SPACE_EMAIL];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const name = match[1]?.trim();
      const email = match[2]?.trim();
      if (!name || !email) continue;
      if (CC_HINT.test(match[0]) || BILLING_HINT.test(match[0])) continue;
      found.push({ name, email });
    }
  }
  const seen = new Set<string>();
  return found.filter((row) => {
    const key = row.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function companiesIn(text: string): string[] {
  return unique([...text.matchAll(COMPANY_RE)].map((m) => m[1] ?? m[0]));
}

function addressesIn(text: string): string[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const hits: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (!STREET_RE.test(lines[i])) continue;
    const chunk = [lines[i]];
    for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
      if (!lines[j]) break;
      if (/^(attn|thanks|hey|lol|slack|drop this|fyi|ship \/)/i.test(lines[j])) break;
      chunk.push(lines[j]);
      if (CITY_ZIP_RE.test(lines[j])) break;
    }
    const cleaned = chunk
      .join("\n")
      .replace(/^(?:HQ|Address|Notice address)\s*:\s*/i, "")
      .trim();
    hits.push(cleaned);
  }

  if (!hits.length) {
    const inline = text.match(
      /\b\d{1,5}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,8},\s*[A-Z][a-zA-Z .]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/,
    );
    if (inline) hits.push(inline[0]);
  }

  return unique(hits, false);
}

function clausesIn(text: string): string[] {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const longLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 140 && LEGAL_HINT.test(line));

  return unique(
    [...blocks, ...longLines].filter(
      (block) => block.length >= 120 && LEGAL_HINT.test(block) && !/wifi password/i.test(block),
    ),
  );
}

export function extractCandidates(clipboard: string): Candidates {
  return {
    emails: emailsIn(clipboard),
    signers: signersIn(clipboard),
    companies: companiesIn(clipboard),
    addresses: addressesIn(clipboard),
    clauses: clausesIn(clipboard),
  };
}

export function isCcEmail(clipboard: string, email: string): boolean {
  const line =
    clipboard
      .split(/\r?\n/)
      .find((row) => row.toLowerCase().includes(email.toLowerCase())) ?? "";
  return CC_HINT.test(line) || /^cc:/i.test(line.trim());
}

export function isBillingEmail(clipboard: string, email: string): boolean {
  const line =
    clipboard
      .split(/\r?\n/)
      .find((row) => row.toLowerCase().includes(email.toLowerCase())) ?? "";
  return BILLING_HINT.test(line) || BILLING_HINT.test(email);
}

export function choiceCriteria(candidates: string[]): Record<string, string | null> {
  const criteria: Record<string, string | null> = {};
  for (const value of candidates) {
    criteria[value] = null;
  }
  criteria[NONE] = "None of these spans belongs in the Lumin Sign workspace.";
  return criteria;
}

export { NONE };
