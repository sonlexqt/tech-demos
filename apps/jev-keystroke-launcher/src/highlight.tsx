import type { ReactNode } from "react";
import { tokenize } from "./text";

export function highlightMatches(text: string, query: string): ReactNode {
  const tokens = tokenize(query).sort((a, b) => b.length - a.length);
  if (tokens.length === 0) return text;

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "ig");
  const parts = text.split(pattern);
  return parts.map((part, index) => {
    const hit = tokens.some((token) => part.toLowerCase() === token);
    return hit ? <mark key={`${part}-${index}`}>{part}</mark> : <span key={`${part}-${index}`}>{part}</span>;
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
