---
description: Initialize a Duckbill feature
model: openai-codex/gpt-5.6-luna
thinking: low
skill: duckbill-specification
restore: true
argument-hint: "<feature> [context...]"
---

Initialize one Duckbill feature.

Feature: `$1`
Initial context: `${@:2}`

The feature argument MUST be present. Use `duckbill-specification` for its initialize operation. This command authorizes
creation of only the feature workspace and its minimal draft specification. It MUST NOT author a ready specification,
create planning artifacts, generate a constitution, or start another Duckbill operation.

Finish with `completed` or `stopped`, list changed artifacts or the blocker, and suggest the immediate next Duckbill
command when useful.
