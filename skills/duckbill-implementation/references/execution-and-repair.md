# Execution and Repair

## Execute

Implement exactly one selected task. Read the constitution, ready specification, current plan, current tasks, selected task, dependencies, project instructions, relevant code, and preflight metadata. Work only inside the task outcome and allowed paths.

Perform the selected Actions as a coherent result. Adapt details only where the plan leaves discretion. Fix failures introduced by this attempt when the correction remains in scope. Run focused checks capable of revealing violations of mapped requirements, plan constraints, and every CHK item.

## Repair

Repair exactly one task from persisted feedback. The feedback, references, and operation identity come from state, not conversation memory. Continue only when expected behavior is already required by specification and the technical approach remains inside plan.

A repair may start from a completed task. It creates a new attempt, invalidates prior task evidence, and does not erase attempt history. If feedback is already satisfied, report `unchanged` unless a persisted interrupted repair still requires completion checks.

## Typed output

```json
{
  "status": "completed",
  "taskId": "hash-password",
  "changedPaths": ["src/auth/password.js"],
  "checks": [
    {"id": "CHK-001", "result": "passed", "summary": "Focused check passed"}
  ],
  "commands": [
    {"command": "npm test -- password", "exitCode": 0, "outputDigest": "sha256:..."}
  ],
  "observedPaths": ["src/auth/password.js"],
  "reason": "Task outcome implemented"
}
```

Allowed status is `completed`, `partial`, `failed`, `blocked`, or `unchanged`. A completed result requires every task check to pass and no hierarchy conflict. Never mark an unrun or unavailable required check as passed.

For phase `preflight`, classify ownership and material readiness without writes. Return `ownership: implementation|plan|specification|material-unknown`. Phase `apply` is allowed only after an implementation-owned preflight and runtime begin transition.

The skill does not write state, choose a next command, format terminal output, or invoke another skill.
