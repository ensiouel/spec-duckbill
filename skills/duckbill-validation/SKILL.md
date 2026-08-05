---
name: duckbill-validation
description: Validate one Duckbill task or a complete feature against current artifacts and repository evidence without repairing code or changing intent.
---

# Duckbill Validation

Evaluate current proof. Do not fix what fails.

## Contract

The caller supplies:

```json
{
  "mode": "validate-task|validate-feature",
  "featureId": "kebab-case-id",
  "taskId": "stable-task-id or null",
  "inputs": {
    "constitution": "path",
    "specification": "path",
    "plan": "path",
    "tasks": "path",
    "stateMetadata": "object",
    "deterministicFindings": [],
    "repositorySnapshot": "object",
    "implementationResult": "object or null"
  },
  "permissions": {"read": [], "write": []}
}
```

`permissions.write` must be empty.

## Reference loading

- `validate-task`: read the `validate-task` and typed result sections of `references/validation.md`, plus `references/evidence.md`.
- `validate-feature`: read the `validate-feature` and typed result sections of `references/validation.md`, plus `references/evidence.md` and `references/staleness.md`.

## Modes

- `validate-task`: evaluate every CHK for the selected task and its mapped higher intent.
- `validate-feature`: evaluate every VAL and the complete current evidence set after deterministic prerequisites pass.

Return the typed validation result. Do not edit code, constitution, specification, plan, tasks, or state; the runtime alone may persist returned validation metadata. Do not ask the user, invoke another skill, choose a next command, or format terminal output.

