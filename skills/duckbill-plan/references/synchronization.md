# Plan Synchronization

Consume the current ready specification and structured synchronization findings supplied by the caller. Update plan.md and tasks.md together without changing specification or code.

Add work for new requirements. Add correction or removal tasks when changed or removed requirements leave implementation that is no longer allowed. Add absence-focused validation when removal must be proved. Do not silently delete linked work before considering current behavior.

Preserve unaffected architecture, tasks, IDs, mappings, and ordering. Return suggested affected task IDs. Never execute generated work.

```json
{
  "status": "completed",
  "artifacts": {"plan": "path", "tasks": "path"},
  "affectedTaskIds": ["changed-task"],
  "reason": "Downstream artifacts synchronized"
}
```
