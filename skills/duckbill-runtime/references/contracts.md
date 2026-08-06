# Runtime Contracts

Every runtime call uses:

```json
{
  "operation": "prepare|verify|clarify|resume|begin|finalize|status|render",
  "command": "duck-spec",
  "featureId": "kebab-case-id",
  "scope": null,
  "taskId": null,
  "inputs": {},
  "permissions": {"read": [], "write": []}
}
```

Reject missing or extra authority. `scope` is `spec`, `plan`, `code`, or null. `taskId` is required only for task operations.

## Prepare result

```json
{
  "status": "ready|blocked|resume_required",
  "command": "duck-spec",
  "featureId": "example",
  "revision": 1,
  "paths": {},
  "artifacts": {},
  "stateMetadata": {},
  "deterministicFindings": [],
  "repositoryContext": {},
  "preimages": {},
  "commandSnapshot": {},
  "stageSnapshot": {},
  "semanticWritePaths": [],
  "commandWritePaths": [],
  "allowedPreExistingPaths": [],
  "clarification": null,
  "reason": "Ready"
}
```

`blocked` includes a structured command result. `resume_required` includes only the matching persisted clarification and its exact source command/mode/arguments.

## Verify result

```json
{
  "status": "verified|blocked",
  "boundary": {},
  "stageSnapshot": {},
  "reason": "Stage writes match its permission set"
}
```

The returned `stageSnapshot` is captured after verification and becomes the baseline for the next semantic stage.

## Clarification results

`clarify` returns:

```json
{
  "status": "needs_clarification|blocked",
  "revision": 2,
  "questions": [],
  "reason": "Clarification persisted"
}
```

`resume` returns:

```json
{
  "status": "ready|needs_clarification|restart_semantic|blocked",
  "revision": 3,
  "context": null,
  "questions": [],
  "stageSnapshot": {},
  "reason": "Clarification resumed"
}
```

## Begin result

```json
{
  "status": "ready|resumed|blocked",
  "revision": 4,
  "operation": {},
  "stageSnapshot": {},
  "reason": "Task operation started"
}
```

## Finalize result

Return exactly one structured command result:

```json
{
  "changed": [],
  "status": "completed|partial|failed|blocked|unchanged|needs_clarification",
  "reason": "Human-readable reason",
  "next": null,
  "warnings": [],
  "evidence": []
}
```

## Deterministic outcome mapping

Task outcome is derived in this order:

1. failed write boundary or ownership conflict -> `blocked`;
2. any CHK result `blocked` -> `blocked`;
3. any CHK result `failed` -> `failed`, or `partial` only when implementation explicitly reports a usable partial outcome;
4. every CHK current and passed -> `completed`, including an `unchanged` implementation whose required outcome is already proven.

Feature validation status is derived only from VAL results:

1. any `blocked` -> `blocked`;
2. otherwise any `failed` -> `failed`;
3. otherwise every required VAL current and passed -> `passed`.

Never copy semantic `status: completed` directly into feature validation state.

## Status and render results

`status` returns the exact structured status from state plus a command result. `render` accepts only a valid structured command result and returns terminal text. Neither operation executes Next.
