---
description: Validate a Duckbill feature
model: openai-codex/gpt-5.6-sol
thinking: high
skill: duckbill-validation
restore: true
boomerang: true
argument-hint: "<feature>"
---

Validate the implementation of one Duckbill feature.

Feature: `$1`
Additional arguments, which MUST be empty: `${@:2}`

The invocation MUST contain exactly one feature argument. Use `duckbill-validation` for its validate operation.
Validation MUST be read-only with respect to repository content and MUST NOT repair findings or start another Duckbill
operation.

Report operation status as `completed` or `stopped` and feature verdict separately as `accepted`, `rejected`, or
`inconclusive`. Report evidence, failures, unavailable checks, and the semantic owner of each material finding.
Translate a specification finding into `/duckbill-refine-spec`, a planning finding into `/duckbill-refine-plan`, and an
implementation finding into `/duckbill-refine-code` for an implemented task or `/duckbill-execute` for pending task
work. Produce at most one useful copy-paste handoff, without inventing unresolved decisions or executing the command.
