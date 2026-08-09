---
description: Plan a Duckbill feature
model: openai-codex/gpt-5.6-sol
thinking: high
skill: duckbill-planning
restore: true
argument-hint: "<feature> [context...]"
---

Create the technical plan and executable tasks for one Duckbill feature.

Feature: `$1`
Additional technical context: `${@:2}`

The feature argument MUST be present. Use `duckbill-planning` for its author operation. This command MAY modify only the
selected `plan.md` and `tasks.md`. It MUST NOT modify the specification or application code, and it MUST NOT start
another Duckbill operation.

Finish with `completed` or `stopped`. Report created artifacts, blockers, and dependency-ready task IDs. Suggest an
explicit execution command template without automatically selecting or executing a task.
