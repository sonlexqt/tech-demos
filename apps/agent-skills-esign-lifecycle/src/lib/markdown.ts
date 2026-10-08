import { esc } from "./dom";

export function splitSections(src: string): { title: string; body: string }[] {
  const chunks = src.split(/^## /m).filter((chunk) => chunk.trim().length > 0);
  return chunks.map((chunk) => {
    const newline = chunk.indexOf("\n");
    const title = (newline === -1 ? chunk : chunk.slice(0, newline)).trim();
    const body = newline === -1 ? "" : chunk.slice(newline + 1).trim();
    return { title, body };
  });
}

export function formatBody(body: string): string {
  const fenced: string[] = [];
  const withFences = body.replace(/```[\w]*\n([\s\S]*?)```/g, (_m, code: string) => {
    const i = fenced.length;
    fenced.push(`<pre><code>${esc(code.replace(/\n$/, ""))}</code></pre>`);
    return `\n%%FENCE${i}%%\n`;
  });

  const lines = withFences.split("\n");
  const out: string[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (list.length === 0) return;
    out.push(`<ul>${list.join("")}</ul>`);
    list = [];
  };

  for (const line of lines) {
    const fence = line.match(/^%%FENCE(\d+)%%$/);
    if (fence) {
      flushList();
      out.push(fenced[Number(fence[1])] ?? "");
      continue;
    }
    const item = line.match(/^[-*] (.+)$/) || line.match(/^- \[[ x]\] (.+)$/);
    if (item) {
      list.push(`<li>${inline(item[1])}</li>`);
      continue;
    }
    flushList();
    if (line.trim() === "") continue;
    out.push(`<p>${inline(line)}</p>`);
  }
  flushList();
  return out.join("");
}

function inline(text: string): string {
  return esc(text)
    .replaceAll(/`([^`]+)`/g, "<code>$1</code>")
    .replaceAll(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}
