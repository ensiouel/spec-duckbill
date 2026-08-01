---
description: Repair a completed step without changing specification or plan intent
argument-hint: "<plan-file>[#L<line>[-<end>]] <step> <feedback>"
---

Repair completed step `$2` in plan `$1` from feedback `${@:3}`.

Example: `/duck-refine-code specs/plans/user-auth/plan.md hash-password src/auth/password.go#L42 Preserve the error cause`

This command MAY change implementation code, tests, and plan-local `state.json`. It MUST preserve specification and
plan intent.

Output MUST be exactly three lines, in order, with nothing else:

```text
Changed: <implementation files, tests, state.json, or none>
Status: <result and reason>
Next: <one exact Duckbill command or none>
```

## Isolation invariant

Load `duckbill-state` independently and use only its bundled deterministic CLI. This command is the sole orchestrator:
load workers independently and give them only canonical artifacts, the selected step ID, and resolved user input—the
original feedback plus direct user answers—never workflow state or another worker's report. Pass only explicit
operations and normalized `{id,result,evidence}` records to the state CLI.

## Flow

1. Missing argument: return `blocked; usage: /duck-refine-code <plan-file> <step> <feedback>` with no changes.
2. Resolve one canonical plan, optional valid line fragment, one stable step ID, valid feedback references, and
   reciprocal specification/plan links. Invalid input blocks without writes.
3. Read state for the selected step. Missing state routes to `/duck-plan`; invalid plan or state blocks; changed plan or
   specification routes to plan refinement. Any `currentStep` or earlier pending step takes precedence and routes to `/duck-execute`.
   Continue only when the selected step is completed.
4. Read instructions, selected plan intent, mapped specification intent, referenced code, and current implementation.
   Reverify prerequisites and use the state CLI to record the complete `PRE-###` set when its stored proof is incomplete
   or no longer credible. Stop before repair if any prerequisite fails or is blocked.
5. Load `duckbill-code-refiner` independently in preflight mode using no state output. Continue only for a governed code
   defect. Already-satisfied feedback is unchanged; plan/specification changes route to their owning refinement;
   material unknowns block without writes.
6. Call the state CLI `begin --mode repair`. Then load the worker in correction mode, apply the smallest governed repair,
   and re-evaluate every selected-step criterion.
7. Build the complete `SC-###` result set. If a higher-level mismatch appeared after `begin`, preserve evaluated
   evidence, mark every unevaluated criterion `blocked`, call `finish` with `failed`, and route to its owner. Otherwise
   call the state CLI `finish` with `completed|partial|failed`.
8. Re-read changed artifacts and state and verify specification and plan intent stayed unchanged. If all steps are
   completed, orchestration itself runs and records the full `VAL-###` set; the code-refiner never owns plan completion
   or another step. Route validation failures to their owning step, plan, specification, or external blocker.
9. Return `completed|partial|failed; <step and plan result>`. `Next` is the first pending step, owning refinement, or
   `none`. Never run the recommendation automatically.
