---
description: Refine a Duckbill specification
model: openai-codex/gpt-5.6-sol
thinking: high
skill: duckbill-specification
restore: true
argument-hint: "<feature> <product-feedback...>"
---

Refine the specification for one Duckbill feature.

Feature: `$1`
Product feedback: `${@:2}`

Both feature and product feedback MUST be present. Use `duckbill-specification` for its refine operation. This command
MAY modify only the selected `spec.md`. It MUST NOT modify `plan.md`, `tasks.md`, application code, or tests, and it
MUST NOT start another Duckbill operation. If refinement needs an unresolved product decision, stop instead of inventing
it.

Finish with `completed` or `stopped`. Report changed requirements or acceptance criteria and downstream planning impact.
When planning reconciliation is clearly required, suggest a copy-paste `/duckbill-refine-plan` command without executing
it.
