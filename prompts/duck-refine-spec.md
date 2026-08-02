---
description: Refine specification intent without changing its plan, state, or implementation
argument-hint: "<spec-file>[#L<line>[-<end>]] <feedback>"
---

Refine specification `$1` from feedback `${@:2}`.

Example: `/duck-refine-spec specs/user-auth.md#L35 Require one-time recovery links`

## Permissions

MAY change only the selected specification. MUST preserve its canonical `plan-file` and MUST NOT change plan intent,
state, implementation, tests, or configuration.

## Clarification

If material specification intent is missing, return only focused `[spec]` questions and stop before writes. Resume after
the answer; omit the terminal result while waiting.

## Flow

### 1. Resolve and inspect

Require feedback and one ready regular `specs/<name>.md`, optionally followed by valid `#L<line>` or
`#L<start>-<end>`. Require exact `plan-file: specs/plans/<name>/plan.md` and, when the plan exists, exact reciprocal
`spec-file: specs/<name>.md`. Invalid input is `blocked`; refinement never repairs metadata.

Snapshot linked plan and state bytes for preservation only; do not interpret state.

### 2. Clarify and preflight

Use `duckbill-clarifier` readiness mode with `specification` scope only for missing intent; after an answer, run
answer-review before rechecking readiness. Then use `duckbill-spec-refiner` preflight mode with the specification,
feedback/references, project instructions, verified facts, and resolved input.

Continue only for a specification-level change. Return plan work, governed code defects, and unresolved ownership to
their exact owning command when known; do not write.

### 3. Refine and verify

Use `duckbill-spec-refiner` refinement mode. Re-run readiness and verify canonical metadata plus unchanged plan, state,
implementation, tests, and configuration. Do not persist derived state staleness.

### 4. Report

Changed intent routes to plan synchronization when a plan exists, otherwise `/duck-plan <spec-file>`. Already-satisfied
feedback is `unchanged` with `Next: none`.

## Terminal result

Never execute `Next`. On a terminal outcome output exactly:

```text
Changed: <none or sorted paths changed by this invocation>
Status: <completed|failed|blocked|unchanged>; <reason>
Next: <one exact Duckbill command or none>
```
