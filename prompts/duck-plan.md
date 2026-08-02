---
description: Create plan intent and initialize plan-local workflow state from a ready specification
argument-hint: "<spec-file>"
---

Create or inspect the plan for specification `$1`.

Example: `/duck-plan specs/user-auth.md`

## Permissions

MAY change canonical `plan.md` and plan-local `state.json`. Specification intent, implementation, tests, and
configuration are read-only. Use the `duckbill-state` CLI as the only state interface.

## Clarification

If a material specification or planning decision is missing, return only focused tagged questions and stop before
writes. Resume after the answer; omit the terminal result while waiting.

## Flow

### 1. Resolve

Require one ready regular `specs/<name>.md`, no line fragment, and exact
`plan-file: specs/plans/<name>/plan.md`. Invalid or draft input is `blocked` with no changes.

### 2. Inspect existing plan

If the plan exists, require exact `spec-file: specs/<name>.md`.

- Restore a missing/wrong backlink only through `duckbill-plan-author` metadata-recovery mode. Verify preservation and
  report `completed` with `Next: /duck-plan <spec-file>`.
- Reject invalid plan format without writes.
- For a valid ID-based plan without state, call state `init` only after plan validation.
- Otherwise call state `read` and route:

| State | Result |
|---|---|
| `plan-changed` or `spec-changed` | `blocked`; plan synchronization command |
| `execute` with `currentStep` | `unchanged`; execute `currentStep` |
| `execute` without `currentStep` | `unchanged`; execute `firstPendingStep` |
| `validation` | `unchanged`; execute the last step |
| `complete` | `unchanged`; `Next: none` |

Every routed `Next` uses the exact Duckbill command.

### 3. Create new plan

For an absent plan, inspect relevant project scope and use `duckbill-clarifier` readiness mode with `both` scope; after
an answer, run answer-review before rechecking readiness. A `[spec]` answer that changes intent routes to
`/duck-refine-spec`; do not apply it here. Then use `duckbill-plan-author` authoring mode with verified facts and
resolved input.

Validate the plan, call state `init`, then re-read both. On failure, remove only files created here and restore any exact
preimage; never leave a new plan without valid state.

### 4. Report

Use the final state's exact first execution/validation command or `none`.

## Terminal result

Never execute `Next`. On a terminal outcome output exactly:

```text
Changed: <none or sorted paths changed by this invocation>
Status: <completed|failed|blocked|unchanged>; <reason>
Next: <one exact Duckbill command or none>
```
