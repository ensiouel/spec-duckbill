---
description: Analyze a Duckbill specification
model: openai-codex/gpt-5.6-sol
thinking: high
skill: duckbill-specification
restore: true
boomerang: true
argument-hint: "<feature>"
---

Review the specification for one Duckbill feature.

Feature: `$1`
Additional arguments, which MUST be empty: `${@:2}`

The invocation MUST contain exactly one feature argument. Use `duckbill-specification` for its analyze operation.
Analysis MUST be read-only and specification-only. It MUST NOT repair findings or review cross-layer consistency as a
separate scope.

Finish with `completed` or `stopped` and report concise, actionable findings. When specification refinement is
appropriate, translate the skill's semantic owner, reason, and needed change into the copy-paste command
`/duckbill-refine-spec $1 "<result-derived product feedback>"`, replacing the placeholder with concise feedback from
the finding. Do not execute it.
