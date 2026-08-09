---
description: "Refine Duckbill: <feature> <spec|plan|code> [task-id] <feedback...>"
model: openai-codex/gpt-5.6-sol
thinking: high
restore: true
argument-hint: "<feature> <spec|plan|code> [task-id] <feedback...>"
---

Refine exactly one Duckbill ownership layer.

Feature: `$1`
Scope: `$2`
Scope payload: `${@:3}`

Interpret the payload only after validating scope:

- for `spec` or `plan`, the entire payload is feedback;
- for `code`, the first payload argument is the task ID and the remaining arguments are feedback.

Before inspecting artifacts or performing refinement, inspect the scope and load exactly one capability through Pi's
native Agent Skill loading mechanism:

- `spec` → load only `duckbill-specification`
- `plan` → load only `duckbill-planning`
- `code` → load only `duckbill-execution`

The selected skill MUST be loaded before refinement begins. Unrelated Duckbill skills MUST NOT be newly loaded for this
operation. If the feature, scope, feedback, or code task is missing, or if the scope is not one of the three supported
values, stop without modifying files.

Use the selected skill for its refine operation. Scope selects the initial owner; it MUST NOT grant permission to modify
an upstream layer. One invocation MUST have one mutation owner and MUST NOT cascade writes into another ownership layer
or start another Duckbill operation.

For `code`, use the execution skill's **Refine** operation, not its **Execute** operation. The selected task MAY already
be `completed`; that status MUST NOT by itself stop code refinement. Evaluate the feedback against the current
specification, plan, task definition, and implementation, then verify the refinement and reconsider whether the task is
`completed` or `pending`.

Finish with `completed` or `stopped`. Report changed artifacts, semantic impact, affected tasks when known, or the
owner, reason, and needed upstream change. Translate a clearly needed handoff into one copy-paste Duckbill command
without executing it.
