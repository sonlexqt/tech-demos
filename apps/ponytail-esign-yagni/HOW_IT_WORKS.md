# How Ponytail works (and how this demo maps)

[Ponytail](https://github.com/DietrichGebert/ponytail) is one prompt: before an agent writes code, it climbs a ladder and **stops at the first rung that holds**. It is lazy about the *solution*, not about reading. Trust-boundary validation, data-loss handling, security, and accessibility are never on the chopping block.

This demo does not run Claude Code. It replays five Lumin Sign tickets with fixtures so you can see the stop-rung, the diff, and the live widget.

## The YAGNI ladder

```mermaid
flowchart TD
  A["Understand the ticket<br/>and the code it touches"] --> B{"1. Does this need<br/>to exist?"}
  B -->|No| S1["Skip it. Say so in one line."]
  B -->|Yes| C{"2. Already in<br/>this codebase?"}
  C -->|Yes| S2["Reuse it. Do not rewrite."]
  C -->|No| D{"3. Stdlib<br/>does it?"}
  D -->|Yes| S3["Use the stdlib."]
  D -->|No| E{"4. Native platform<br/>feature?"}
  E -->|Yes| S4["Use the platform."]
  E -->|No| F{"5. Installed<br/>dependency?"}
  F -->|Yes| S5["Use the dep. Do not add a new one."]
  F -->|No| G{"6. Can it be<br/>one line?"}
  G -->|Yes| S6["Write the one line."]
  G -->|No| S7["7. The minimum<br/>that works."]
```

Two rungs would work → take the higher one and move on. Output shape: code first, then `skipped: X. add when Y.`

## Normal vs Ponytail paths

```mermaid
flowchart LR
  T["Feature ticket"] --> N["Normal agent"]
  T --> P["Ponytail"]
  N --> N1["Reach for a library"]
  N1 --> N2["Wrapper + context + CSS"]
  N2 --> N3["New files and deps"]
  P --> P1["Read existing helpers"]
  P1 --> P2["Stop at first holding rung"]
  P2 --> P3["Smallest diff that keeps<br/>validation / a11y / security"]
```

Caveman is a different skill: it shrinks *prose*. Ponytail shrinks *code*. The authors’ published suite (12 feature tasks, Haiku 4.5, n=4) reported Ponytail −54% LOC / −20% cost / −27% time vs no-skill, and Caveman −20% LOC with a slight cost/time *increase*. Those numbers are that suite, not a promise for every repo.

## How the demo maps

```mermaid
flowchart TB
  subgraph tickets [Tickets tab]
    T1["Signing-date → rung 4 Native<br/>input type=date"]
    T2["Initials + color → rung 4 Native<br/>input type=color"]
    T3["Reminders → rung 2 Repo<br/>scheduleReminders + presets"]
    T4["CC list → rung 2 Repo<br/>RecipientList role=cc"]
    T5["Expiry → rung 3 Stdlib<br/>Intl.RelativeTimeFormat"]
  end
  subgraph review [Review tab]
    R1["Over-built PR fixture"]
    R2["/ponytail-review tags"]
    R3["delete / native / yagni / stdlib / shrink"]
    R4["net: -N lines possible"]
    R1 --> R2 --> R3 --> R4
  end
  tickets --> review
```

| Demo surface | Upstream idea |
| --- | --- |
| Highlighted ladder rung | First holding rung in `skills/ponytail/SKILL.md` |
| `skipped` / `add when` lines | Ponytail output contract |
| “Never cut” chips | Validation / a11y / security exclusions |
| Review tags | `skills/ponytail-review/SKILL.md` |
| Offline fixture + optional env key | Demo must run with no secrets |
| Published suite table | Authors’ agentic benchmark, labeled as such |

The fixture repo is a small Lumin Sign envelope app that already has `formatDate`, `scheduleReminders`, `RecipientList` (including `role="cc"`), `isEmail`, and `expiresAt`. Normal agents ignore that shelf. Ponytail reads it first.
