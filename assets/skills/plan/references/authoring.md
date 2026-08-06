# Plan and Task Authoring

Start only from a deterministic-valid ready specification. Inspect project instructions, module boundaries, interfaces, similar code, tests, configuration, and safe commands. Never guess a path or symbol; label a path as new when it does not exist.

Choose the smallest coherent architecture that satisfies specification. Create plan.md and tasks.md together. Map every US, FR, NFR, and AC through a real plan section and executable task, and map every required ID to feature validation.

Task boundaries follow outcomes. Merge actions that must land together to keep the project buildable. Split only independently meaningful outcomes with real dependencies. Do not create tasks solely for running a command, editing one file, or writing tests that belong to an implementation outcome.

Return:

```json
{
  "status": "completed",
  "artifacts": {"plan": "path", "tasks": "path"},
  "affectedTaskIds": [],
  "reason": "Plan and tasks created"
}
```
