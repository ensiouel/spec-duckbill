---
description: Develop a Duckbill specification
model: openai-codex/gpt-5.6-sol
thinking: high
skill: duckbill-specification
restore: true
argument-hint: "<feature> [context...]"
---

Develop the current draft specification for one Duckbill feature.

Feature: `$1`
Additional product context: `${@:2}`

The feature argument MUST be present. Use `duckbill-specification` for its author operation. This command MAY modify
only the selected `spec.md`. It MUST NOT create or modify planning artifacts or application code, and it MUST NOT start
another Duckbill operation.

Finish with `completed` or `stopped`. Report material decisions, clarification needs, and readiness. When complete,
suggest planning as the next operation and mention specification analysis only as an optional review.
