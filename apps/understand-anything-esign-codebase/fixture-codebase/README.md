# Lumin Sign (fixture mini codebase)

Tiny TypeScript e-sign core used by the Understand Anything demo. It is **not** the production Lumin Sign service.

Modules the graph tours:

1. **Create request** — validate payload, persist, kick off routing / fields / reminders.
2. **Signer routing** — `ORDER` (group 1 → 2 → 3) vs `PARALLEL`.
3. **Field prep** — place signature / date / initials and bind them to signers.
4. **Reminders** — cadence (day 1 / 3 / 7) and due-scan.
5. **Webhooks** — emit + retry `signature_request.*` events.
6. **Audit trail** — append-only events for every state change.

To regenerate a real Understand Anything graph from this folder (optional, needs an LLM-backed agent):

```bash
# from a clone of https://github.com/Egonex-AI/Understand-Anything
/plugin marketplace add Egonex-AI/Understand-Anything
/plugin install understand-anything
# then, with this directory as the project root:
/understand
```

Copy `.ua/knowledge-graph.json` over `apps/understand-anything-esign-codebase/public/ua/knowledge-graph.json`.
The demo ships a faithful committed graph so `bun run dev` needs no plugin and no keys.
