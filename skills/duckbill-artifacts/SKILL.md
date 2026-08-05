---
name: duckbill-artifacts
description: Create, refine, or synchronize Duckbill specification, technical plan, and executable tasks in an explicit mode selected by a Duckbill command.
---

# Duckbill Artifacts

Generate semantic artifact content at the level owned by the selected mode.

## Contract

The caller supplies:

```json
{
  "mode": "create-spec|refine-spec|create-plan|refine-plan|sync-artifacts",
  "featureId": "kebab-case-id",
  "inputs": {
    "constitution": "path or null",
    "specification": "path or null",
    "plan": "path or null",
    "tasks": "path or null",
    "feedback": "string or null",
    "syncFindings": "object or null",
    "templates": [],
    "projectContext": []
  },
  "permissions": {"read": [], "write": []}
}
```

Reject a missing/unsupported mode or any requested write outside `permissions.write`.

For `create-spec`, `templates` contains the bundled specification template. For `create-plan`, it contains the bundled plan and tasks templates. Treat templates only as starting structure; references remain normative and override any accidental template discrepancy. Other modes may receive an empty template list.

## Reference loading

- `create-spec`: read `references/formats.md` and `references/authoring.md`.
- `refine-spec`: read `references/formats.md` and the Specification authoring plus Refinement sections of `references/authoring.md`.
- `create-plan`: read `references/formats.md` and the Plan and task authoring section of `references/authoring.md`.
- `refine-plan`: read `references/formats.md` and the Plan and task authoring plus Refinement sections of `references/authoring.md`.
- `sync-artifacts`: read `references/formats.md` and the Synchronization section of `references/authoring.md`.
- Read `references/clarification.md` only when a material unknown is found or persisted answers are supplied.

## Modes and permissions

- `create-spec`: write only canonical `spec.md`.
- `refine-spec`: write only canonical `spec.md`.
- `create-plan`: create canonical `plan.md` and `tasks.md` together.
- `refine-plan`: update canonical `plan.md`, `tasks.md`, or both. Reject all writes if the proposal contradicts specification.
- `sync-artifacts`: update canonical `plan.md` and `tasks.md` together from current specification and structured sync findings.

The constitution, application code, tests, and state are read-only in every mode. Never initialize, inspect, or edit `state.json`.

## Result

Return the typed result defined by `references/authoring.md`, or the typed clarification result. Include exact written artifact paths and suggested affected task IDs. Do not ask the user directly, invoke another skill, select a next command, or format terminal output.
