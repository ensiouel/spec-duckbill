---
description: Execute one pending Duckbill task
model: openai-codex/gpt-5.6-terra
thinking: medium
skill: duckbill-execution
restore: true
argument-hint: "<feature> <task-id> [context...]"
---

Execute exactly one selected Duckbill task.

Feature: `$1`
Task: `$2`
Additional implementation context: `${@:3}`

Both feature and task arguments MUST be present. Use `duckbill-execution` for its execute operation, which performs
pending task work. If the selected task is already `completed`, stop and explain that new implementation feedback
belongs to code refinement. This command MAY modify application code, tests, and the selected task's completion state.
It MUST NOT modify the specification or plan, select a different task, or start another Duckbill operation.

Finish with `completed` or `stopped`. Report changed files, verification, remaining blockers, and any upstream owner
needed. Translate a planning-owned stop into `/duckbill-refine-plan` and a specification-owned stop into
`/duckbill-refine-spec`. If execution-owned work remains, suggest `/duckbill-refine-code` for an implemented task that
needs adjustment or `/duckbill-execute` for pending task work. Do not execute a suggested command or automatically
choose another task.
