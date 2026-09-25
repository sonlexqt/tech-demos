import type { Candidates, ExpireHint, PersonCandidate, SigningType } from "../src/types";

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const NAME_EMAIL_ANGLE =
  /([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)+)\s*<([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})>/g;
const NAME_THEN_EMAIL =
  /([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)+)\s*[—–\-:,]\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const NAME_SPACE_EMAIL =
  /([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)+)\s+([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const NONE = "none";

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw.replace(/\s+/g, " ").trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function lineFor(clipboard: string, email: string): string {
  return (
    clipboard
      .split(/\r?\n/)
      .find((row) => row.toLowerCase().includes(email.toLowerCase())) ?? ""
  );
}

function isJunkEmail(email: string, line: string): boolean {
  const blob = `${email} ${line}`.toLowerCase();
  return (
    /\b(wifi|password|hunter2|calendar\.google|noreply@)\b/.test(blob) ||
    /ignore that one|do not put that/.test(blob)
  );
}

function isCcLine(line: string): boolean {
  return /^\s*cc\s*:/i.test(line) || /\b(don't add as signer|do not add as signer|pls don't add)\b/i.test(line);
}

function isViewerLine(line: string): boolean {
  return /\b(viewer|deal desk|visibility|should not sign|not a signer|viewer only)\b/i.test(line);
}

function inferGroup(line: string, leading?: number): number | undefined {
  if (leading && leading >= 1 && leading <= 10) return leading;
  if (/\b(counsel|harborlegal|signs first|first)\b/i.test(line)) return 1;
  if (/\b(customer|acme\.io)\b/i.test(line)) return 2;
  if (/\b(vp|internal)\b/i.test(line)) return 3;
  return undefined;
}

function wantsVerification(line: string): boolean {
  return /\b(id verify|driver_license|digital trust|\bvc\b|verifiable credential|photo_id)\b/i.test(
    line,
  );
}

function peopleIn(clipboard: string): PersonCandidate[] {
  const found: PersonCandidate[] = [];
  const patterns = [NAME_EMAIL_ANGLE, NAME_THEN_EMAIL, NAME_SPACE_EMAIL];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    for (const match of clipboard.matchAll(pattern)) {
      const name = match[1]?.trim();
      const email = match[2]?.trim();
      if (!name || !email) continue;
      const line = lineFor(clipboard, email);
      if (isJunkEmail(email, line)) continue;
      const numbered = line.match(/^\s*(\d+)[.)]\s*/);
      const leading = numbered ? Number(numbered[1]) : undefined;
      let kind: PersonCandidate["kind"] = "signer";
      if (isCcLine(line)) kind = "cc";
      else if (isViewerLine(line)) kind = "viewer";
      found.push({
        name,
        email,
        kind,
        group: kind === "signer" ? inferGroup(line, leading) : undefined,
        verify: kind === "signer" && wantsVerification(line),
      });
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

function emailsIn(text: string): string[] {
  return unique(text.match(EMAIL_RE) ?? []).filter((email) => {
    const line = lineFor(text, email);
    return !isJunkEmail(email, line);
  });
}

function titlesIn(text: string): string[] {
  const hits: string[] = [];
  const titled = text.match(/title should be\s+([^\n]+)/i);
  if (titled?.[1]) hits.push(titled[1].replace(/[.“”"]/g, "").trim());
  const re = text.match(/^\s*Re:\s*(.+)$/im);
  if (re?.[1]) hits.push(re[1].trim());
  const msa = text.match(/Acme Robotics\s+[—–-]\s+Master Services Agreement[^\n]*/i);
  if (msa) hits.push(msa[0].trim());
  return unique(hits).filter((t) => t.length >= 8 && t.length <= 255);
}

function endOfMonth(monthIndex: number, from = new Date()): number {
  const year = from.getUTCFullYear();
  const month = from.getUTCMonth() <= monthIndex ? monthIndex : monthIndex;
  const useYear = from.getUTCMonth() > monthIndex ? year + 1 : year;
  return Date.UTC(useYear, month + 1, 0, 23, 59, 59, 0);
}

function expiresIn(text: string, now = Date.now()): ExpireHint[] {
  const hints: ExpireHint[] = [];
  const endMonth = text.match(/end of\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i);
  if (endMonth?.[1]) {
    const label = `end of ${endMonth[1].toLowerCase()}`;
    hints.push({ label, ms: endOfMonth(MONTHS[endMonth[1].toLowerCase()], new Date(now)) });
  }
  const days = text.match(/expir\w+\s+(?:in\s+)?(\d+)\s+days/i);
  if (days) {
    const n = Number(days[1]);
    hints.push({ label: `${n} days`, ms: now + n * 24 * 60 * 60 * 1000 });
  }
  const iso = text.match(/expir\w+[^\n]*(\d{4}-\d{2}-\d{2})/i);
  if (iso?.[1]) {
    hints.push({ label: iso[1], ms: Date.parse(`${iso[1]}T23:59:59.000Z`) });
  }
  return hints.filter((h) => Number.isFinite(h.ms) && h.ms > now);
}

function signingTypesIn(text: string): SigningType[] {
  const types: SigningType[] = [];
  if (/\b(ORDER|signing order|counsel\s*→|signs FIRST|not same-time)\b/i.test(text)) {
    types.push("ORDER");
  }
  if (/\bSAME_TIME|same[- ]time|parallel sign/i.test(text)) types.push("SAME_TIME");
  return unique(types) as SigningType[];
}

function afterLabel(text: string, labels: RegExp): string[] {
  const hits: string[] = [];
  for (const match of text.matchAll(labels)) {
    const value = match[1]?.trim().replace(/^[:—–-]\s*/, "");
    if (value) hits.push(value);
  }
  return unique(hits);
}

export function extractCandidates(clipboard: string, now = Date.now()): Candidates {
  return {
    emails: emailsIn(clipboard),
    people: peopleIn(clipboard),
    titles: titlesIn(clipboard),
    expires: expiresIn(clipboard, now),
    signingTypes: signingTypesIn(clipboard),
    subjects: afterLabel(clipboard, /(?:email subject|subject(?:_name)?)\s*[:—–-]?\s*([^\n]+)/gi),
    emailTitles: afterLabel(clipboard, /(?:email title)\s*[:—–-]?\s*([^\n]+)/gi),
    senderEmails: unique(
      (clipboard.match(/sender:\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/gi) ?? []).map(
        (row) => row.replace(/^sender:\s*/i, ""),
      ),
    ),
    textTags: /\buse text tags\b/i.test(clipboard),
  };
}

export function isCcEmail(clipboard: string, email: string): boolean {
  return isCcLine(lineFor(clipboard, email));
}

export function choiceCriteria(candidates: string[]): Record<string, string | null> {
  const criteria: Record<string, string | null> = {};
  for (const value of candidates) criteria[value] = null;
  criteria[NONE] = "None of these spans belongs on SignatureRequestDTO.";
  return criteria;
}

export { NONE };
