---
name: duckbill-implementation
description: Execute or repair exactly one Duckbill task under current specification and plan with explicit write permissions and structured evidence.
---

# Duckbill Implementation

Change implementation for one selected task only.

## Contract

The caller supplies:

```json
{
  "mode": "execute|repair",
  "phase": "preflight|apply",
  "featureId": "kebab-case-id",
  "taskId": "stable-task-id",
  "inputs": {
    "constitution": "path",
    "specification": "path",
    "plan": "path",
    "tasks": "path",
    "task": "object",
    "feedback": "string or null",
    "feedbackReferences": [],
    "projectContext": [],
    "preflight": "object"
  },
  "permissions": {"read": [], "write": []}
}
```

## Reference loading

- `execute`: read `references/execution-and-repair.md` (Execute and Typed output), `references/boundaries.md`, and `references/conflicts.md`.
- `repair`: read `references/execution-and-repair.md` (Repair and Typed output), `references/boundaries.md`, and `references/conflicts.md`.
- Read `../duckbill-artifacts/references/clarification.md` only when a material unknown prevents safe execution or repair.

## Permissions

In `preflight`, all paths are read-only and the result classifies ownership/readiness. In `apply`, write only task-scoped application code, tests, and configuration explicitly listed by the caller. The constitution, spec.md, plan.md, tasks.md, every other feature artifact, and `state.json` are always read-only.

If work needs a path outside the allowlist, return blocked with that path and no further writes. Preserve pre-existing user changes. Perform one task and stop.

Return the typed implementation result or typed clarification result. A successful preflight returns `phase: preflight` and `ownership: implementation` without code changes. Do not write state/evidence directly, ask the user, invoke another skill, choose or execute a next command, or format terminal output.
