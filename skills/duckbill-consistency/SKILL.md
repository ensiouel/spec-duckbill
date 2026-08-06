---
name: duckbill-consistency
description: Analyze the complete Duckbill hierarchy and coverage or prepare structured downstream synchronization changes in a read-only explicit mode. Use for `/duck-analyze --scope all` and the preparation stage of `/duck-sync`.
---

# Duckbill Consistency

Inspect agreement between intent levels without editing them.

## Contract

The caller supplies:

```json
{
  "mode": "analyze-all|prepare-sync",
  "featureId": "kebab-case-id",
  "inputs": {
    "constitution": "path",
    "specification": "path",
    "plan": "path or null",
    "tasks": "path or null",
    "stateMetadata": "object or null",
    "deterministicFindings": [],
    "repositoryContext": []
  },
  "permissions": {"read": [], "write": []}
}
```

`permissions.write` must be empty.

## Reference loading

- `analyze-all`: read `references/hierarchy-and-coverage.md` and `references/analysis.md`.
- `prepare-sync`: read `references/hierarchy-and-coverage.md` and `references/synchronization.md`.

## Modes

- `analyze-all`: decide whether constitution, specification, plan, tasks, state metadata, and supplied implementation facts agree.
- `prepare-sync`: return structured changes needed to align plan/tasks with current specification. Do not apply them.

`prepare-sync` may return the typed clarification result defined by `references/synchronization.md`. Analysis expresses ambiguity as typed findings because analysis is strictly read-only.

Return the typed analysis or synchronization result from the loaded reference. Do not write an analysis artifact, interact with the user, invoke another skill, choose a next command, or format terminal output.
