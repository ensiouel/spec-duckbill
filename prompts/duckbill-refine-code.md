---
description: Refine one Duckbill task implementation
model: openai-codex/gpt-5.6-terra
thinking: medium
skill: duckbill-execution
restore: true
argument-hint: "<feature> <task-id> <implementation-feedback...>"
---

Refine the implementation of one explicit Duckbill task.

Feature: `$1`
Task: `$2`
Implementation feedback: `${@:3}`

Feature, task, and feedback MUST all be present. Use `duckbill-execution` for its refine operation. The selected task
MAY be `pending` or `completed`; completed status alone MUST NOT stop refinement. This command MAY modify application
code, tests, justified relevant configuration, and only the selected task's completion state. It MUST NOT modify
`spec.md` or `plan.md`, select another task, or start another Duckbill operation.

Finish with `completed` or `stopped`. Report changed files, verification, and whether the selected task is `completed`
or `pending`. If feedback changes technical design, stop before implementation mutation and suggest a copy-paste
`/duckbill-refine-plan` command. If it changes specification-owned WHAT or WHY, stop before implementation mutation and
suggest `/duckbill-refine-spec`. Do not load an upstream skill or execute a suggested command.
