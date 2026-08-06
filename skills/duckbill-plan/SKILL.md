---
name: duckbill-plan
description: Create, refine, or synchronize one Duckbill technical plan and executable task set in an explicit mode. Use for `/duck-plan`, plan-scoped `/duck-refine`, and the artifact-writing stage of `/duck-sync`; never change specification intent or implementation.
---

# Duckbill Plan

Own HOW and executable task design beneath a ready specification.

## Contract

The caller supplies:

```json
{
  "mode": "create-plan|refine-plan|sync-plan",
  "featureId": "kebab-case-id",
  "inputs": {
    "constitution": "path",
    "specification": "path",
    "plan": "path or null",
    "tasks": "path or null",
    "feedback": "string or null",
    "syncFindings": "object or null",
    "templates": ["path"],
    "projectContext": [],
    "clarification": "object or null"
  },
  "permissions": {"read": [], "write": []}
}
```

Reject a missing mode, a write outside canonical plan.md/tasks.md, or any proposal that contradicts the specification.

## Reference loading

- `create-plan`: read `references/formats.md` and `references/authoring.md`.
- `refine-plan`: read `references/formats.md` and `references/refinement.md`.
- `sync-plan`: read `references/formats.md` and `references/synchronization.md`.
- Read `references/clarification.md` only for a material plan-owned unknown or persisted answers.

## Assets

For `create-plan`, resolve `assets/plan.md` and `assets/tasks.md` relative to this `SKILL.md`, require regular files inside the skill directory, and receive both paths in `inputs.templates`. Treat templates only as starting structure; references are normative. Other modes receive no templates.

## Modes

- `create-plan`: create canonical plan.md and tasks.md together.
- `refine-plan`: update plan.md, tasks.md, or both from explicit plan/task-design feedback.
- `sync-plan`: update plan.md and tasks.md together from the current specification and structured sync findings.

Constitution and specification are read-only. State, application code, tests, and configuration are outside every write set. Return the typed plan result or clarification result, including suggested affected task IDs. Do not interact with the user, invoke another skill, select a next command, or format terminal output.
