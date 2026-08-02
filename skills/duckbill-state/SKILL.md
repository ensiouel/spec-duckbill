---
name: duckbill-state
description: Internal Duckbill state adapter; use only when an active Duckbill command requires the bundled deterministic CLI to initialize, inspect, transition, validate, or reconcile plan-local state.json. Never use standalone or for semantic or routing decisions.
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
nonzero exit, preserve stderr's structured error and stop.

Treat the script as the only source of truth for state shape, enums, transitions, validation, and persistence.

## Boundaries

- MUST NOT hand-edit `state.json`, bypass the CLI, or retry a rejected transition with altered facts.
- MUST NOT restate or override transition rules in natural language.
- MUST NOT infer semantic evidence, affected IDs, ownership, routing, or a next command.
- MUST NOT invoke another module. The active command supplies explicit typed arguments and owns all semantic decisions.
- MUST NOT copy state into a specification or plan. The bundled script owns validation and atomic persistence.

Expose only the CLI result to the active command; do not format a terminal result.
