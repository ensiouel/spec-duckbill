---
description: Refine a Duckbill plan and tasks
model: openai-codex/gpt-5.6-sol
thinking: high
skill: duckbill-planning
restore: true
argument-hint: "<feature> <technical-feedback...>"
---

Refine the technical plan and tasks for one Duckbill feature.

Feature: `$1`
Technical or planning feedback: `${@:2}`

Both feature and feedback MUST be present. Use `duckbill-planning` for its refine operation. This command MAY modify
only the selected `plan.md` and `tasks.md`. It MUST NOT modify `spec.md`, application code, or tests, and it MUST NOT
start another Duckbill operation. Planning must compare the feedback with the complete current specification before
mutating planning artifacts.

Finish with `completed` or `stopped`. Report affected tasks. If specification-owned meaning would change, stop before
mutation and suggest a copy-paste `/duckbill-refine-spec` command. After successful refinement, suggest
`/duckbill-refine-code` for an implemented task that needs adjustment or `/duckbill-execute` for pending or new task
work when applicable. Do not execute a suggested command.
