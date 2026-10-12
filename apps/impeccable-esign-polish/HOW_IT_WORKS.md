# How this demo works

Impeccable is a design vocabulary for AI coding agents: **1 skill**, **24 `/impeccable` commands**, live browser iteration, and **59 deterministic detector rules**. This demo is the detector — not a restyle gallery.

## Deterministic detectors vs LLM critique

```mermaid
flowchart LR
  subgraph deterministic [No LLM]
    SRC[HTML / CSS / JSX source<br/>or rendered URL]
    CLI["npx impeccable detect"]
    RULES[59 rule matchers]
    FIND[Findings: id, severity,<br/>snippet, category]
    SRC --> CLI --> RULES --> FIND
  end

  subgraph llm [Needs a model]
    CRIT["/impeccable critique"]
    JUDGE[Hierarchy, taste,<br/>emotional resonance]
    CRIT --> JUDGE
  end

  FIND -->|"CI, hooks, this demo"| HUMAN[Reviewer or agent]
  JUDGE --> HUMAN
```

The CLI and browser extension run the 59 rules with **no API key**. Exit `0` = no primary findings (advisories may remain). Exit `2` = primary findings. Exit `1` = a target could not be scanned.

`/impeccable critique` is a different layer: it uses an LLM to judge things the regex/layout engines will not (identical-card grids as a design problem, hero-metric taste, “does this page feel like a signing desk”). This app never calls that layer.

## Detect → findings → fix loop

```mermaid
sequenceDiagram
  participant U as Reviewer
  participant UI as Demo chrome
  participant D as Detector
  participant F as Lumin Sign fixture

  U->>UI: Run detector
  UI->>D: GET /api/detect
  D->>D: npx impeccable detect --json fixtures/signer-slop.html
  alt CLI engine available
    D-->>UI: source=cli + findings[]
  else CLI missing or failed
    D-->>UI: source=fixture + captured JSON
  end
  UI->>UI: Group by antipattern id
  U->>UI: Click a finding
  UI->>F: Outline [data-rule]
  U->>UI: Apply fix
  UI->>F: data-fixed += rule id
  UI->>UI: Finding clears, open count drops
```

Each finding card shows:

| Field | Source |
| --- | --- |
| Detector id | CLI `antipattern` (`side-tab`, `gray-on-color`, …) |
| Severity | `warning` or `advisory` |
| Element / snippet | Mapped selector + CLI `snippet` |
| Why it matters | E-sign specific note (not in upstream) |
| Command | Which of the 24 `/impeccable` verbs would address it |

Applying a fix is the **live-mode analogue**: the page updates immediately. The HTML file the CLI scans is unchanged until someone edits `fixtures/signer-slop.html` and runs `bun run detect`.

## How the demo maps to Impeccable

```mermaid
flowchart TB
  subgraph upstream [pbakaus/impeccable]
    SKILL[Skill: /impeccable]
    CMDS[24 commands]
    DET[59 detectors]
    LIVE[Live browser iteration]
    SKILL --- CMDS
    SKILL --- DET
    SKILL --- LIVE
  end

  subgraph demo [apps/impeccable-esign-polish]
    PAGE[Fixture MSA countersign page]
    SCAN[detect API + findings.cli.json]
    PANEL[Findings panel]
    FIX[Per-rule CSS fixes]
    VOCAB[Command vocabulary strip]
    PAGE --> SCAN --> PANEL --> FIX
    PANEL --> VOCAB
  end

  DET --> SCAN
  CMDS --> VOCAB
  LIVE -.-> FIX
```

| Impeccable piece | In this demo |
| --- | --- |
| `npx impeccable detect` | Vite `/api/detect` + `bun run detect` |
| Rule catalog | Real ids from a scan of `fixtures/signer-slop.html` |
| `/impeccable colorize` | Fixes `ai-color-palette`, `gradient-text`, `gray-on-color` |
| `/impeccable typeset` | Fixes `overused-font`, `tiny-text`, `tight-leading` |
| `/impeccable layout` | Fixes `nested-cards` |
| `/impeccable polish` | Fixes `side-tab`, `broken-image` |
| `/impeccable quieter` | Fixes `dark-glow` |
| `/impeccable audit` | Fixes `low-contrast`, `skipped-heading` |
| `/impeccable clarify` | Fixes `marketing-buzzword` |
| `/impeccable critique` / `craft` / `live` | Shown in the vocabulary; not executed (LLM or harness) |

The fixture is a **Lumin Sign** signer review-and-sign surface (envelope MSA-2026-4412, Northwind ↔ Lumin countersign). Slop is intentional so the detector has something to say. After fixes, the same task remains — review the MSA and sign — without the AI tells.
