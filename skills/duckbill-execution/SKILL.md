---
name: duckbill-execution
description: Execute or repair exactly one Duckbill task under current specification and plan with explicit write permissions and structured evidence. Use for `/duck-execute` and code-scoped `/duck-refine`; never change intent artifacts or state directly.
---

# Duckbill Execution

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

- `execute`: read the Execute and Typed output sections of `references/execution-and-repair.md`, plus `references/boundaries.md` and `references/conflicts.md`.
- `repair`: read the Repair and Typed output sections of `references/execution-and-repair.md`, plus `references/boundaries.md` and `references/conflicts.md`.
- Read `references/clarification.md` only when a material unknown prevents safe execution or repair.

## Permissions

In `preflight`, keep every path read-only and classify ownership/readiness. In `apply`, write only task-scoped application code, tests, and configuration explicitly listed by the caller. Keep constitution, spec.md, plan.md, tasks.md, all other feature artifacts, and state.json read-only.

If work needs a path outside the allowlist, return blocked with that path and stop. Preserve pre-existing user changes. Perform one task and stop.

Return the typed execution or clarification result. A successful preflight returns `phase: preflight` and `ownership: implementation` without code changes. Do not write state/evidence directly, ask the user, invoke another skill, choose or execute a next command, or format terminal output.
