import type { ColorToken, DesignSystem } from "./types";

function field(md: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = md.match(new RegExp(`\\*\\*${escaped}:\\*\\*\\s*(.+)`));
  return match?.[1]?.trim() ?? "";
}

function listField(md: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = md.match(new RegExp(`- \\*\\*${escaped}:\\*\\*\\s*(.+)`));
  return match?.[1]?.trim() ?? "";
}

function stripMd(value: string): string {
  return value.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`/g, "").trim();
}

export function parseMaster(md: string): DesignSystem {
  const colors: ColorToken[] = [];
  for (const line of md.split("\n")) {
    const row = line.match(
      /^\|\s*([^|]+?)\s*\|\s*`?(#[0-9A-Fa-f]{3,8})`?\s*\|\s*`([^`]+)`\s*\|/,
    );
    if (row) {
      colors.push({ role: row[1].trim(), hex: row[2], cssVar: row[3] });
    }
  }

  const antiPatterns = md
    .split("\n")
    .filter((line) => line.includes("❌"))
    .map((line) =>
      line
        .replace(/^[\s-]*❌\s*/, "")
        .replace(/\*\*/g, "")
        .replace(/\s+—\s+.*$/, "")
        .trim(),
    )
    .filter(Boolean);

  const checklist = md
    .split("\n")
    .filter((line) => /^-\s+\[[ x]\]/i.test(line))
    .map((line) => line.replace(/^-\s+\[[ x]\]\s*/i, "").trim());

  const fontsLink = md.match(/\[[^\]]+\]\((https:\/\/fonts\.googleapis\.com[^)]+)\)/);
  const importUrl = md.match(/@import url\('([^']+)'\)/);

  return {
    project: field(md, "Project") || "Lumin Sign",
    generated: field(md, "Generated"),
    category: field(md, "Category"),
    colors,
    colorNotes: field(md, "Color Notes"),
    headingFont: listField(md, "Heading Font") || "EB Garamond",
    bodyFont: listField(md, "Body Font") || "Lato",
    typeMood: listField(md, "Mood"),
    googleFontsUrl: fontsLink?.[1] ?? importUrl?.[1] ?? "",
    style: stripMd(field(md, "Style")),
    styleKeywords: field(md, "Keywords"),
    patternName: stripMd(field(md, "Pattern Name")),
    conversion: listField(md, "Conversion Strategy"),
    cta: listField(md, "CTA Placement"),
    sections: listField(md, "Section Order"),
    keyEffects: field(md, "Key Effects"),
    antiPatterns,
    checklist,
  };
}

export function colorMap(ds: DesignSystem): Record<string, string> {
  const map: Record<string, string> = {};
  for (const token of ds.colors) {
    map[token.cssVar] = token.hex;
  }
  return map;
}
