---
name: duckbill-state
description: Run the bundled deterministic CLI whenever Duckbill orchestration needs to initialize, inspect, transition, validate, or reconcile a plan-local state.json. Use only for mechanical workflow state; semantic decisions and routing remain with the calling command.
---

# Duckbill State

Use the bundled CLI as the only interface to workflow state. Resolve `scripts/state.mjs` relative to this `SKILL.md`
and invoke it with an absolute path:

```bash
node <skill-directory>/scripts/state.mjs <operation> --repo <repository-root> --plan <plan-file> [options]
```

## Operations

- `read [--step <step-id>]`
- `init`
- `record --scope <prerequisites|validation> --checks <json-array>`
- `begin --step <step-id> --mode <execute|repair>`
- `finish --step <step-id> --outcome <completed|partial|failed> --checks <json-array>`
- `sync-plan --affected <comma-separated-step-ids|none>`

Pass check records only as `{id,result,evidence}` objects. Treat stdout as the JSON summary or write receipt. On a
nonzero exit, preserve stderr's structured error, stop, and leave recovery to the caller.

Treat the script as the only source of truth for state shape, enums, transitions, validation, and persistence.

## Boundaries

- MUST NOT hand-edit `state.json`, bypass the CLI, or retry a rejected transition with altered facts.
- MUST NOT restate or override transition rules in natural language.
- MUST NOT infer semantic evidence, affected IDs, ownership, routing, or a next command.
- MUST NOT invoke or return data to another skill. The calling command supplies explicit typed arguments and owns all
  semantic decisions.
- MUST NOT copy state into a specification or plan. The bundled script owns validation and atomic persistence.

Return only the CLI result to the calling command.
