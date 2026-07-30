---
description: Correct the current step's code from feedback and regenerate its isolated patch
argument-hint: "<plan-file>[#L<line>[-<end>]] <step> <feedback>"
---

Correct implementation code while keeping plan intent unchanged.

- Plan file: `$1`
- Step selector: `$2`
- Feedback: `${@:3}`

Examples:

```text
/duck-refine-code specs/plans/user-auth/plan.md hash-password internal/auth/password.go#L42 Preserve the original error
/duck-refine-code specs/plans/user-auth/plan.md hash-password specs/plans/user-auth/steps/hash-password.patch#L120 Avoid logging the password hash
```

Flow:

1. If the plan reference, step, or feedback is empty, show
   `Usage: /duck-refine-code <plan-file>[#L<line>[-<end>]] <step> <feedback>` with the examples above and stop.
2. Parse `$1` as a canonical repository-relative path `specs/plans/<name>/plan.md`, optionally followed by exactly
   `#L<line>` or `#L<start>-<end>`. Remove the optional line fragment to obtain the path. Stop on a missing path or
   invalid range. Read the complete plan, treat selected lines as initial feedback context, and resolve the step by ID,
   number, or heading. Require a unique stable ID, require `Current Step` to equal it, and require `Base Tree` to be
   valid; otherwise stop because the isolated patch cannot be rebuilt safely. If an earlier step has absent or non-
   `completed` Execution status or an unchecked Success Criterion, stop without changes and report that step as `Next`;
   code refinement must not bypass it.
3. Extract and read feedback references written as `path`, `path#L<line>`, or `path#L<start>-<end>`. Do not interpret
   other line-reference formats. Stop on an invalid file or range.
4. Read applicable project instructions, the specification from plan frontmatter `spec-file`, step context, and
   implicated files. Require specification frontmatter `plan-file` to point back to the selected plan.
5. Do not change plan or specification intent. If feedback requires it or exposes a material unknown, stop and recommend
   `/duck-refine-plan` or `/duck-refine-spec` as appropriate.
6. Increment `Attempt`, set `Patch Status` to `building`, and reset every `Validation Checklist` item to `[ ]` before
   changing implementation.
7. Load and follow `duckbill-code-refiner`; apply only the selected step's correction.
8. Persist the code refiner's complete verified result in the selected step, including criterion checkboxes and its
   `Status`, `Attempt`, and `Files Changed`. Preserve criterion text, order, and requirement mappings.
9. Load `duckbill-step-patch` and rebuild the patch from the existing baseline. Set its status to `current`, or
   `unavailable` with the reason.
10. When all implementation steps are completed, require and persist the code refiner's final plan validation. Treat a
    missing, failed, blocked, or incomplete final result as incomplete.
11. Re-read the plan and verify that the code refiner's complete result and patch status were persisted without changing
    plan intent.
12. Confirm that specification and plan intent remain unchanged. End with exactly three concise lines:
    - `Changed: <changed paths or none>`
    - `Status: <step and plan state, with a short reason>`
    - `Next: /duck-execute <plan path> <next executable step ID>` when unambiguous, otherwise `Next: none`
      Add details only for blockers, failed checks, patch failures, or verification evidence needed to understand an
      incomplete result.

A referenced file is context, not automatic edit permission. Failed checks remain pending.
