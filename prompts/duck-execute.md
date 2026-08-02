---
description: Execute exactly one plan step without changing specification or plan intent
argument-hint: "<plan-file> <step-id>"
---

Execute step `$2` from plan `$1`.

Example: `/duck-execute specs/plans/user-auth/plan.md hash-password`

## Permissions

MAY change implementation, tests, governed configuration, and plan-local `state.json`. MUST NOT change specification or
plan intent. Use the `duckbill-state` CLI as the only state interface.

## Clarification

If preflight finds a material specification, plan, or user decision, use `duckbill-clarifier` readiness mode with the
needed scope and return only focused tagged questions. After an answer, run answer-review before rechecking readiness.
Stop before `begin` or implementation writes and omit the terminal result while waiting.

## Flow

### 1. Resolve and inspect state

Require canonical `specs/plans/<name>/plan.md`, one existing stable step ID, and exact reciprocal link with
`specs/<name>.md`. Invalid input is `blocked` with no changes.

Call state `read --step <step-id>` and take the first matching route:

| State | Result/action |
|---|---|
| missing | `blocked`; `/duck-plan <spec-file>` |
| invalid | `blocked`; `Next: none` |
| plan/spec changed | `blocked`; plan synchronization command |
| `complete` | `unchanged`; `Next: none` |
| `validation` | final validation |
| any `currentStep` with `currentOperation: repair|unknown` | `blocked`; `Next: none` |
| different `currentStep` with `currentOperation: execute` | `unchanged`; execute it |
| earlier `firstPendingStep` | `unchanged`; execute it |
| selected `currentStep` with `currentOperation: execute` | resume without `begin` |
| selected `firstPendingStep` | continue |

An interrupted repair must resume through `/duck-refine-code` with explicit feedback; an unknown legacy operation needs
manual inspection. Every routed `Next` uses the exact Duckbill command.

### 2. Verify prerequisites and preflight

Read project instructions, selected/mapped intent, dependencies, and current code. When stored prerequisite proof is
absent or stale, evaluate and record every ordered `PRE-###`. Stop before `begin` on failed/blocked prerequisites.

Use `duckbill-step-executor` preflight mode with the selected step, governing specification, current implementation, and
resolved input. Continue only within unchanged specification and plan intent; otherwise route to the exact owner.

### 3. Execute and persist

For a new attempt call state `begin --step <step-id> --mode execute`; a resumed attempt skips it. Use
`duckbill-step-executor` execution mode for only the selected step.

Use its ordered `criteria` as the complete `{id,result,evidence}` set passed to `finish`. If higher-level
mismatch appears after `begin`, preserve evaluated evidence, mark unevaluated criteria `blocked`, and finish `failed`;
otherwise finish `completed`, `partial`, or `failed` from evidence.

### 4. Final validation

Enter from state `validation` or after `finish`, then re-read state. When all steps are completed, reverify
prerequisites and evaluate/record every `VAL-###` against the combined implementation without editing it. Classify
failures by owner.

### 5. Report

Re-read changed artifacts/state. `Next` is the first pending step, exact owning refinement/repair command, interrupted
current step, or `none`.

## Terminal result

Never execute `Next`. On a terminal outcome output exactly:

```text
Changed: <none or sorted paths changed by this invocation>
Status: <completed|partial|failed|blocked|unchanged>; <step and overall result>
Next: <one exact Duckbill command or none>
```
