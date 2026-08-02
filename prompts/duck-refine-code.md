---
description: Repair a completed step without changing specification or plan intent
argument-hint: "<plan-file> <step-id> <feedback>"
---

Repair completed step `$2` in plan `$1` from feedback `${@:3}`.

Example: `/duck-refine-code specs/plans/user-auth/plan.md hash-password src/auth/password.go#L42 Preserve the error cause`

## Permissions

MAY change implementation, tests, governed configuration, and plan-local `state.json`. MUST preserve specification and
plan intent. References are context, not edit permission. Use the `duckbill-state` CLI as the only state interface.

## Clarification

If preflight finds a material specification, plan, or user decision, use `duckbill-clarifier` readiness mode with the
needed scope and return only focused tagged questions. After an answer, run answer-review before rechecking readiness.
Stop before `begin` or implementation writes and omit the terminal result while waiting.

## Flow

### 1. Resolve and inspect state

Require feedback, canonical `specs/plans/<name>/plan.md`, one stable step ID, valid optional feedback line references,
and exact reciprocal link with `specs/<name>.md`. Invalid input is `blocked` with no changes.

Call state `read --step <step-id>` and take the first matching route:

| State | Result |
|---|---|
| missing | `blocked`; `/duck-plan <spec-file>` |
| invalid | `blocked`; `Next: none` |
| plan/spec changed | `blocked`; plan synchronization command |
| `currentStep` with `currentOperation: execute` | `unchanged`; execute it |
| selected `currentStep` with `currentOperation: repair` | resume correction without `begin` |
| different `currentStep` with `currentOperation: repair` | `blocked`; `Next: none` |
| any `currentStep` with `currentOperation: unknown` | `blocked`; `Next: none` |
| earlier `firstPendingStep` | `unchanged`; execute it |
| selected step not completed | `blocked`; execute it |
| selected step completed | continue |

Resume a selected repair using the feedback supplied to this invocation. A different interrupted repair requires its
original command and feedback; an unknown legacy operation requires manual inspection. Every routed `Next` uses the
exact Duckbill command.

### 2. Verify prerequisites and preflight

Read project instructions, selected/mapped intent, dependencies, feedback references, and current code. When stored
prerequisite proof is absent or stale, evaluate and record every ordered `PRE-###`. Stop before `begin` on failed/blocked
prerequisites.

Use `duckbill-code-refiner` preflight mode with the selected step, specification, feedback/references, current
implementation, resolved input, and whether this is a selected resumed repair. Continue only for a governed code
defect or resumed-repair validation. Already-satisfied feedback is unchanged only when no repair is active; a resumed
repair still proceeds to ordered criteria and `finish`. Return higher-level work or unresolved ownership to the exact
owner without writes.

### 3. Correct and persist

For a new repair call state `begin --step <step-id> --mode repair`; a selected resumed repair skips it. Then use
`duckbill-code-refiner` correction mode for the smallest governed repair.

Use its ordered `criteria` as the complete `{id,result,evidence}` set passed to `finish`. If higher-level mismatch
appears after `begin`, preserve evaluated evidence, mark unevaluated criteria `blocked`, and finish `failed`; otherwise
finish `completed`, `partial`, or `failed` from evidence.

### 4. Final validation

Re-read state. When all steps are completed, reverify prerequisites and evaluate/record every `VAL-###` against the
combined implementation without editing it. Classify failures by owner.

### 5. Report

Re-read changed artifacts/state and verify specification/plan intent unchanged. `Next` is the first pending step, exact
owning refinement command, or `none`.

## Terminal result

Never execute `Next`. On a terminal outcome output exactly:

```text
Changed: <none or sorted paths changed by this invocation>
Status: <completed|partial|failed|blocked|unchanged>; <step and overall result>
Next: <one exact Duckbill command or none>
```
