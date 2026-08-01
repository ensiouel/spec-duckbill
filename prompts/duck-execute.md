---
description: Execute exactly one plan step without changing specification or plan intent
argument-hint: "<plan-file> <step-id>"
---

Execute step `$2` from plan `$1`.

Example: `/duck-execute specs/plans/user-auth/plan.md hash-password`

This command MAY change implementation code, tests, and plan-local `state.json`. It MUST NOT change specification or
plan intent.

Output MUST be exactly three lines, in order, with nothing else:

```text
Changed: <implementation files, tests, state.json, or none>
Status: <result and reason>
Next: <one exact Duckbill command or none>
```

## Isolation invariant

Resolve `../scripts/state.mjs` relative to this prompt as the deterministic state CLI.

This command is the sole orchestrator. Load each skill independently. A skill MUST NOT invoke another skill or receive
another skill's report. Semantic workers receive canonical project artifacts, the selected step ID, and resolved user
input containing only direct user answers relevant to this command; they never receive `state.json`, state output, or
another skill's analysis. Orchestration verifies and normalizes worker evidence before sending only
`{id,result,evidence}` records to the deterministic state CLI.

## Flow

1. Missing argument: return `blocked; usage: /duck-execute <plan-file> <step-id>` with no changes.
2. Require canonical `specs/plans/<name>/plan.md`, one stable step ID, and reciprocal specification/plan links. Invalid
   input blocks without writes.
3. Read state for the selected step:
   - missing state routes to `/duck-plan <spec-file>`; invalid plan or state blocks without repair;
   - `plan-changed` or `spec-changed` routes to `/duck-refine-plan <plan-file> whole Synchronize the plan with its specification`;
   - `complete` returns unchanged with `Next: none`;
   - `validation` continues at step 8;
   - a different `currentStep` or earlier pending step returns its exact `/duck-execute` command;
   - the selected `currentStep` resumes its existing attempt; otherwise the selected ID MUST equal `firstPendingStep`.
4. Read project instructions, the selected plan step, its mapped specification intent, dependencies, and current code.
   Verify all prerequisites directly. If their stored results are incomplete or no longer credible, use the state CLI
   to record the full `PRE-###` result set. Any failed or blocked prerequisite stops before an attempt.
5. Load `duckbill-step-executor` independently in preflight mode using only canonical artifacts and resolved user input.
   Stop before writes for specification intent, plan intent, or a material unknown and return the owning refinement
   command when one exists.
6. If this is not a resumed attempt, call the state CLI `begin --mode execute`. After it succeeds, load the executor in
   execution mode and implement exactly the selected step. A resumed attempt uses the same worker without another
   `begin`.
7. Normalize every `SC-###` result and call the state CLI `finish` with `completed|partial|failed`. The CLI rejects
   `completed` unless all selected-step criteria pass.
8. Enter this step either directly from `validation` mode or after `finish`, then re-read state. When all steps are
   completed, orchestration itself reverifies prerequisites, runs every `VAL-###` item against the combined
   implementation, and records the complete validation result set. No semantic worker decides whether final validation
   is due. Final validation does not edit implementation. Classify failures by owning step, plan, specification, or
   external blocker.
9. Re-read changed artifacts and state. If the worker discovered a higher-level mismatch after `begin`, close the
   attempt as `failed` with a complete `SC-###` result set: preserve current evidence and mark every unevaluated
   criterion `blocked` with the mismatch as evidence. Report the owning refinement; never hand-edit state.
10. Return `completed|partial|failed; <step and overall result>`. `Next` is the first pending step, owning refinement or
    repair command, the current step after an interrupted operation, or `none`. Recommendations never run automatically.
