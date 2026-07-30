---
description: Execute one step from an implementation plan
argument-hint: "<plan-file> <step>"
---

Execute one implementation plan step.

- Plan file: `$1`
- Step selector: `$2`

Examples:

```text
/duck-execute specs/plans/user-auth/plan.md hash-password
/duck-execute specs/plans/user-auth/plan.md 1
```

Flow:

1. If either argument is empty, show `Usage: /duck-execute <plan-file> <step>` with the examples above and stop.
2. Require a canonical repository-relative path `specs/plans/<name>/plan.md` to an existing plan and reject line
   fragments. Read the complete plan. Resolve the step by exact ID, number, or case-insensitive heading; prefer ID and
   list available IDs when the selector is missing or ambiguous. If the selected step lacks a unique ID, stop and
   recommend normalizing the whole plan with `/duck-refine-plan`. Find the first step in plan order whose Execution
   status is absent or not `completed`, or whose Success Criteria contain an unchecked item. When no such step exists,
   stop without changes because the implementation steps are already completed. Otherwise require the selected step to
   be that step. When it is not, stop without changes, name the required step ID, and report its command in `Next`.
   Never skip an incomplete, failed, partial, or stale earlier step.
3. Read applicable project instructions, the specification identified by plan frontmatter `spec-file`, and selected-step
   context. Stop if `spec-file` is missing or invalid, or if specification frontmatter `plan-file` does not point back
   to the selected plan.
4. Verify every plan prerequisite. Mark each prerequisite `[x]` only when current evidence proves it; leave it `[ ]` and
   stop when it is unmet.
5. Derive `<plan-directory>/steps/<step-id>.patch` and load `duckbill-step-patch`. Before changing implementation:
    - when `Execution State` is absent, treat it as an untouched plan, capture one snapshot, and add the section after
      Prerequisites using the plan format;
    - otherwise, if `Current Step` starts with `retired:` while `Base Tree` is valid, stop because unresolved structural
      refinement still owns that baseline; offer restoring one coherent step with the original ID or explicitly
      restoring implementation to `Base Tree`;
    - otherwise reuse `Base Tree` when `Current Step` equals this step's ID and the tree is valid;
    - for any other existing state, capture one new snapshot, set it as `Base Tree`, and reset `Attempt` to `0`.
6. Increment `Attempt`; store the selected step ID in `Current Step`; record the patch path; set `Patch Status` to
   `building`. Reset every `Validation Checklist` item to `[ ]` because implementation is about to change.
7. Load and follow `duckbill-step-executor`. Execute only the selected step. Tell it whether all other implementation
   steps are already completed so it can run final plan validation if this step also completes.
8. Persist the executor's complete verified result in the selected step, including criterion checkboxes and its
   `Status`, `Attempt`, and `Files Changed`. Keep requirement mappings unchanged.
9. Rebuild the patch from `Base Tree`. Set `Patch Status` to `current`, or `unavailable` with the exact failure reason.
10. When all implementation steps are completed, require and persist the executor's final plan validation. Treat a
    missing, failed, blocked, or incomplete final result as incomplete and name the affected checks and step IDs.
11. Re-read the saved plan and patch. Verify that the executor's complete result and patch status were persisted without
    changing plan intent. End with exactly three concise lines:
    - `Changed: <changed paths or none>`
    - `Status: <step and plan state, with a short reason>`
    - `Next: /duck-execute <plan path> <first incomplete step ID>` when one remains, otherwise `Next: none`
      Add details only for blockers, failed checks, patch failures, or evidence needed to understand an incomplete
      result.

Stop before changes when dependencies, required authorization, retired-step patch ownership, or a material requirement
or implementation decision is unresolved. Ask the user to clarify the documents before execution. A failed check stays
unchecked; a failed patch must never be reported as available.
