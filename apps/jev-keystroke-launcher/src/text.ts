const STOP = new Set([
  "the",
  "a",
  "an",
  "i",
  "to",
  "on",
  "of",
  "for",
  "and",
  "in",
  "my",
  "me",
]);

export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP.has(token));
}
