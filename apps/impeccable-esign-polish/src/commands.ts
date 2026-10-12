import type { CommandDef, CommandId, RuleMeta } from "./types";

/** The 24 /impeccable commands from pbakaus/impeccable README (v4.5.2). */
export const COMMANDS: CommandDef[] = [
  { id: "init", summary: "Record durable product truth in PRODUCT.md", layer: "setup" },
  { id: "document", summary: "Generate DESIGN.md from existing code", layer: "setup" },
  { id: "extract", summary: "Pull reusable tokens into the design system", layer: "setup" },
  { id: "shape", summary: "Plan UX/UI before writing code", layer: "llm" },
  { id: "craft", summary: "Full shape-then-build with visual iteration", layer: "llm" },
  { id: "critique", summary: "UX review: hierarchy, clarity, resonance", layer: "llm" },
  { id: "audit", summary: "Technical checks: a11y, performance, responsive", layer: "deterministic" },
  { id: "polish", summary: "Final pass and design-system alignment", layer: "deterministic" },
  { id: "bolder", summary: "Amplify boring designs", layer: "llm" },
  { id: "quieter", summary: "Tone down overly bold designs", layer: "deterministic" },
  { id: "distill", summary: "Strip to essence", layer: "llm" },
  { id: "harden", summary: "Errors, i18n, overflow, edge cases", layer: "deterministic" },
  { id: "onboard", summary: "First-run flows and empty states", layer: "llm" },
  { id: "animate", summary: "Add purposeful motion", layer: "deterministic" },
  { id: "colorize", summary: "Introduce strategic color", layer: "deterministic" },
  { id: "typeset", summary: "Fix font choices, hierarchy, sizing", layer: "deterministic" },
  { id: "layout", summary: "Fix layout, spacing, visual rhythm", layer: "deterministic" },
  { id: "delight", summary: "Add moments of joy", layer: "llm" },
  { id: "overdrive", summary: "Add technically extraordinary effects", layer: "llm" },
  { id: "clarify", summary: "Improve unclear UX copy", layer: "deterministic" },
  { id: "adapt", summary: "Adapt for different devices", layer: "llm" },
  { id: "optimize", summary: "Performance improvements", layer: "llm" },
  { id: "live", summary: "Iterate on elements in the browser", layer: "live" },
  { id: "generate", summary: "Generate live-browser variants", layer: "live" },
];

/**
 * Which command a reviewer would reach for after a given detector id.
 * Mapping follows Impeccable's own slop catalog command links
 * (colorize / typeset / layout / polish / quieter / audit / clarify).
 */
export const RULE_META: Record<string, RuleMeta> = {
  "side-tab": {
    command: "polish",
    element: ".doc-card, .feature-card",
    whyEsign:
      "A colored stripe on every card reads as an alert. On a countersign page, false urgency competes with the actual unsigned fields.",
    fixLabel: "Remove side-tab stripes",
  },
  "gradient-text": {
    command: "colorize",
    element: "h1.hero-title, .metric",
    whyEsign:
      "Gradient headlines look decorative. Signers need a plain, unambiguous title so they know which instrument they are adopting.",
    fixLabel: "Use solid ink for titles",
  },
  "low-contrast": {
    command: "audit",
    element: ".fine-print, .decline, .sign-btn",
    whyEsign:
      "Attestation and decline copy must meet WCAG AA. Low-contrast legal text is how people miss what they are agreeing to.",
    fixLabel: "Raise contrast to AA",
  },
  "gray-on-color": {
    command: "colorize",
    element: "button.sign-btn",
    whyEsign:
      "The primary Sign control is the commitment. Gray on purple fails contrast and looks disabled — dangerous on a legal action.",
    fixLabel: "Ink the Sign button",
  },
  "dark-glow": {
    command: "quieter",
    element: "body, .glass-card, .sign-btn",
    whyEsign:
      "Neon halos belong to AI dashboards, not a countersign desk. Glow pulls the eye off the document and the signature field.",
    fixLabel: "Drop chromatic glows",
  },
  "broken-image": {
    command: "polish",
    element: "img[alt='Signer avatar']",
    whyEsign:
      "A broken avatar next to the signer name undermines trust. Identity of the countersigner should never render as a missing asset.",
    fixLabel: "Replace with initials",
  },
  "tight-leading": {
    command: "typeset",
    element: ".fine-print",
    whyEsign:
      "Cramped line-height on envelope terms makes the attestation unreadable. Legal body copy needs room to track line to line.",
    fixLabel: "Open line-height to 1.5",
  },
  "tiny-text": {
    command: "typeset",
    element: ".fine-print, .decline",
    whyEsign:
      "11px terms are how e-sign UIs hide the adoption language. Body and controls start at 14–16px so the act of signing is legible.",
    fixLabel: "Raise body text to 16px",
  },
  "overused-font": {
    command: "typeset",
    element: "body, .sign-btn",
    whyEsign:
      "Inter on a signing surface is the default AI face. A legal product should sound like itself, not every generated SaaS template.",
    fixLabel: "Swap Inter for a legal face",
  },
  "nested-cards": {
    command: "layout",
    element: ".glass-card > .nested-inner > .doc-card",
    whyEsign:
      "Cards inside cards shrink the MSA preview. Signers need the instrument, not three frames of padding around it.",
    fixLabel: "Flatten the document stack",
  },
  "skipped-heading": {
    command: "audit",
    element: "h1.hero-title → h3",
    whyEsign:
      "Screen-reader users jump by heading. Skipping h2 on a review-and-sign page hides the document title in the outline.",
    fixLabel: "Restore h2 for the MSA",
  },
  "ai-color-palette": {
    command: "colorize",
    element: ":root, body, .sign-btn",
    whyEsign:
      "Purple-to-cyan on dark is the loudest AI tell. A countersign product should use a restrained, brand-owned palette.",
    fixLabel: "Move to a teal legal palette",
  },
  "marketing-buzzword": {
    command: "clarify",
    element: "header p",
    whyEsign:
      "“Supercharge” and “world-class” do not belong above an MSA. The page should name the parties, the instrument, and the action.",
    fixLabel: "Rewrite the pitch as facts",
  },
};

export const FALLBACK_META: RuleMeta = {
  command: "polish",
  element: "fixtures/signer-slop.html",
  whyEsign: "This detector fired on the signer fixture. Clear the tell so the legal task stays in front.",
  fixLabel: "Apply the matching polish",
};

export function commandLabel(id: CommandId): string {
  return `/impeccable ${id}`;
}
