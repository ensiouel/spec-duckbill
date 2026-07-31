---
description: Repair a completed step without changing specification or plan intent
argument-hint: "<plan-file>[#L<line>[-<end>]] <step> <feedback>"
---

Repair completed step `$2` in plan `$1` from feedback `${@:3}`.

Example: `/duck-refine-code specs/plans/user-auth/plan.md hash-password src/auth/password.go#L42 Preserve the error cause`

This is a repair branch, not the next waterfall stage. It MAY change implementation code, tests, the selected patch,
and execution state. It MUST NOT change specification intent or plan intent.

Output MUST be exactly three lines, in order, with nothing else:

```text
Changed: <implementation files, tests, plan state, patch, or none>
Status: <result and reason>
Next: <one exact Duckbill command or none>
```

Flow:

1. Missing argument: return `blocked; usage: /duck-refine-code <plan-file> <step> <feedback>` with `Changed: none`,
   `Next: none`.
2. Parse canonical `specs/plans/<name>/plan.md` plus optional exact line fragment. Read the full plan and valid feedback
   references; resolve one unique stable step. Invalid input returns `blocked` with no changes.
3. Require the selected step to have `Execution` with `Status: completed` and Attempt ≥ 1. A new/unexecuted,
   `partial`, `failed`, or `stale` step returns `unchanged; selected step requires execution` and its exact
   `/duck-execute`. An earlier such step takes precedence: return `unchanged; earlier execution work takes precedence`
   and that earlier `/duck-execute`.
4. Read the governing specification from plan `spec-file`; require its reciprocal `plan-file`. Missing/invalid governing
   spec returns `blocked; governing specification link is invalid`, `Next: none`. A valid specification with a bad
   backlink returns `blocked; reciprocal plan link is invalid`, `Next: /duck-spec <spec-file>`. Read instructions,
   selected step, referenced code, and current patch; record all governed artifacts before writes.
5. Load `duckbill-code-refiner` in preflight mode. Complete classification, permissions, and clarification before any
   mutation:

| Feedback | Action | Status | Next |
|---|---|---|---|
| code defect already governed by specification and plan intent | continue | — | — |
| implementation already satisfies governing intent | STOP | `unchanged; feedback is already satisfied` | first later `/duck-execute`, otherwise `none` |
| plan-level change | STOP | `blocked; requested change belongs in the plan` | `/duck-refine-plan <plan-file> <step-id-or-whole> <normalized feedback>` |
| specification-level change | STOP | `blocked; requested change belongs in the specification` | `/duck-refine-spec <spec-file> <normalized feedback>` |
| material unknown | STOP | `blocked; material unknown: <concise clarification question>` | `none` |

   A STOP result MUST use `Changed: none`, create no Attempt, and leave every repository file and execution-state field
   byte-for-byte unchanged.
6. For a code defect, prepare an isolated repair baseline before editing:
   - `Current Step` equals selected ID: require and reuse its valid Base Tree;
   - previously completed non-current step: capture a fresh Base Tree, set it as Current Step, and later replace only
     this step's patch.
   Preserve prior attempts; increment the selected step's prior Attempt once and store the same global/per-step value.
   Set Patch Status `building` and reset only affected evidence.
7. Resume `duckbill-code-refiner` in correction mode. Change only code/tests needed for the defect. In the plan, MAY
   update only execution state: checkmarks; step Status/Attempt/Files Changed; Base Tree/Current Step/Attempt/Patch/Patch
   Status. MUST preserve approach/scope, prerequisite text/order, context, Actions, criteria text/order, dependencies,
   validation definitions, risks, structure, and mappings exactly.
8. Load `duckbill-step-patch`; rebuild only the selected step patch from the chosen Base Tree. Set Patch Status
   `current` or `unavailable: <exact reason>`. A retryable patch failure uses
   `Next: /duck-execute <plan-file> <step-id>` for patch recovery; external action uses `Next: none` and the cause in
   `Status`.
9. Re-read every changed artifact and rerun applicable checks. Verify intent unchanged and execution state truthful. If
   a higher-level blocker escaped preflight, undo only this command's mutations and verify the recorded artifacts
   byte-for-byte before returning blocked.
10. If final validation is required, classify each failed item:

| Owner | Next |
|---|---|
| selected step | `/duck-execute <plan-file> <step-id>`; keep it `partial` or `failed` |
| another unique `completed` step | `/duck-refine-code <plan-file> <affected-step-id> <normalized feedback>` |
| plan/specification intent | owning refinement command |
| material unknown/external action | `none` |

11. Final status is `completed|partial|failed; <step and plan result>`. When execution work remains, `Next` MUST be its
   first exact `/duck-execute`; otherwise use the validation/classification route or `none`. Recommendations belong only
   in `Next` and never run automatically.
