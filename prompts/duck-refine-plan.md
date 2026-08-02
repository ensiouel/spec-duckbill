---
description: Refine plan intent without changing specification or code
argument-hint: "<plan-file>[#L<line>[-<end>]] <step|whole> <feedback>"
---

Refine plan `$1`, target `$2`, from feedback `${@:3}`.

Example: `/duck-refine-plan specs/plans/user-auth/plan.md hash-password Split hashing from registration`

## Permissions

MAY change selected `plan.md` and mechanically synchronize `state.json`. MUST preserve `spec-file` and MUST NOT change
specification intent, implementation, tests, or configuration. Use the `duckbill-state` CLI as the only state interface.

## Clarification

If material specification or planning intent is missing, return only focused tagged questions and stop before writes.
Resume after the answer; omit the terminal result while waiting.

## Flow

### 1. Resolve and inspect

Require feedback, canonical `specs/plans/<name>/plan.md` with optional valid line fragment, and target `whole` or one
stable step ID. Require exact reciprocal `spec-file: specs/<name>.md` and
`plan-file: specs/plans/<name>/plan.md`; refinement never repairs metadata.

Call state `read`:

- Missing state routes to `/duck-plan <spec-file>`; invalid plan/state is `blocked` without repair.
- A `currentStep` with current hashes routes to its exact `/duck-execute` command.
- `plan-changed` or `spec-changed` continues to synchronization preflight.

### 2. Clarify and preflight

Use `duckbill-clarifier` readiness mode with `both` scope only for material ambiguity; after an answer, run answer-review
before rechecking readiness. Then use `duckbill-plan-refiner` preflight mode with plan, specification,
feedback/references, project instructions, verified facts, and resolved input.

Continue only for plan-level work or specification synchronization. Return specification work, governed code defects,
and unresolved ownership to their exact owning command when known; do not write.

### 3. Refine, persist, and verify

Use `duckbill-plan-refiner` refinement mode to update only the plan. Validate before supplying only its
`affectedStepIds` to state `sync-plan --affected <step-ids|none>`; `changedDefinitionIds` are informational. On
validation/synchronization failure, restore the exact plan preimage. Never hand-edit state; re-read plan and state after
success.

### 4. Report

Route pending work to the final state's first exact `/duck-execute`; a synchronized complete plan uses `Next: none`.

## Terminal result

Never execute `Next`. On a terminal outcome output exactly:

```text
Changed: <none or sorted paths changed by this invocation>
Status: <completed|failed|blocked|unchanged>; <reason>
Next: <one exact Duckbill command or none>
```
