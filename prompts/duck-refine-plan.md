---
description: Refine an implementation plan, resolving new questions in the plan or governing specification before execution
argument-hint: "<plan-file>[#L<line>[-<end>]] <step|whole> <feedback>"
---

Refine an implementation plan while keeping implementation code unchanged.

- Plan reference: `$1`
- Target: `$2`
- Feedback: `${@:3}`

Examples:

```text
/duck-refine-plan specs/plans/user-auth/plan.md hash-password Split hashing from registration
/duck-refine-plan specs/plans/user-auth/plan.md#L70-110 whole Reorder these steps by dependency
```

Flow:

1. If the plan reference, target, or feedback is empty, show
   `Usage: /duck-refine-plan <plan-file>[#L<line>[-<end>]] <step|whole> <feedback>` with the examples above and stop.
2. Parse the plan reference as a canonical repository-relative path `specs/plans/<name>/plan.md`, optionally followed by
   exactly `#L<line>` or `#L<start>-<end>`. Remove the optional line fragment to obtain the plan path and keep the
   selection as initial feedback context. Stop on a missing path or invalid range.
3. Validate and read the complete plan. Require repository-relative frontmatter `spec-file`. Read applicable project
   instructions and the governing specification. Require a reciprocal frontmatter `plan-file`; stop on a missing or
   conflicting link.
4. Treat `whole` as whole-plan mode. Otherwise resolve the target by exact ID, number, or case-insensitive heading;
   prefer ID. Use it as the primary focus. Change related plan content only when necessary to preserve valid
   dependencies, mappings, criteria, or execution truth. The line selection highlights context but does not expand the
   requested outcome.
5. Read the selected plan lines when supplied. Then extract and read additional feedback references written as `path`,
   `path#L<line>`, or `path#L<start>-<end>`. Do not interpret other line-reference formats. Stop on an invalid file or
   range.
6. Load `duckbill-clarifier`. Inspect the project first, ask about every material unknown introduced or exposed by the
   feedback, and pause for answers.
7. In `whole` mode, ask once for confirmation before saving only when the resolved change would invalidate executed work
   or make current patch ownership ambiguous. Otherwise continue without confirmation.
8. When an answer changes required behavior, scope, contracts, data, security, or acceptance, update the governing
   specification through `duckbill-spec-refiner` first. Then load and follow `duckbill-plan-refiner` so the plan matches
   it. Put implementation-only answers directly into the plan. If either refiner returns another material unknown,
   return to step 6.
9. Re-read both artifacts. When the specification changed, require the spec refiner final check to pass. In all cases,
    require the plan refiner final validation and both clarifier readiness gates to pass. Verify reciprocal links.
10. End with exactly three concise lines:
    - `Changed: <changed paths or none>`
    - `Status: <ready, blocked, or stale, with a short reason>`
    - `Next: /duck-execute <plan path> <first affected step ID>` when unambiguous, otherwise `Next: none`
      Add details only for unresolved questions, blockers, structural recovery choices, or verification failures.

Limit changes to the selected plan and, only when clarification changes the source of truth, the governing
specification. Do not repair or migrate metadata implicitly or modify code. If feedback also requests code changes,
finish the documents first and recommend `/duck-refine-code` or `/duck-execute`.
