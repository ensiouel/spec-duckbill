---
description: Refine a specification and synchronize its implementation plan
argument-hint: "<spec-file>[#L<line>[-<end>]] <feedback>"
---

Refine a specification and synchronize a related implementation plan when one exists.

- Specification: `$1`
- Feedback: `${@:2}`

Example:

```text
/duck-refine-spec specs/user-auth.md#L35 Require one-time recovery links
```

Flow:

1. If the specification reference or feedback is empty, show
   `Usage: /duck-refine-spec <spec-file>[#L<line>[-<end>]] <feedback>` with the example above and stop.
2. Parse `$1` as a repository-relative specification path, optionally followed by exactly `#L<line>` or
   `#L<start>-<end>`. Remove the optional line fragment to obtain the path. Stop on a missing path or invalid range.
   Read selected lines as initial feedback context, then validate and read the complete specification and applicable
   project instructions. For `status: draft`, stop and recommend `/duck-spec <spec-file>`.
3. Resolve the related plan only from specification frontmatter `plan-file`:
   - when `plan-file` is absent, continue without a plan;
   - when present, require the canonical repository-relative path `specs/plans/<name>/plan.md` to an existing plan, read
     the plan completely, and verify its frontmatter `spec-file` identifies the selected specification;
   - stop when either link is invalid, missing, or conflicting. Do not search for another plan or relink documents.
4. Extract and read feedback references written as `path`, `path#L<line>`, or `path#L<start>-<end>`. Do not interpret
   other line-reference formats. Stop on an invalid file or range.
5. Record the original requirements and, when present, plan structure.
6. Load `duckbill-clarifier`. Ask about every material unknown introduced or exposed by the feedback and pause for
   answers. Repeat until the specification readiness gate passes.
7. Load and follow `duckbill-spec-refiner`; modify only the selected specification in this phase and keep its reciprocal
   `plan-file` link when one exists. If it returns another material unknown, return to step 6.
8. Re-read it, identify the semantic changes, and require the spec refiner final check and the clarifier specification
   readiness gate to pass.
9. When a plan exists, load and follow `duckbill-plan-refiner` to synchronize it. If synchronization exposes a material
   implementation unknown, use `duckbill-clarifier`, ask, pause, and finish the plan only after its readiness gate
   passes. Do not change code.
10. Re-read every changed file and verify reciprocal links. End with exactly three concise lines:
    - `Changed: <changed paths or none>`
    - `Status: <ready, blocked, or stale, with a short reason>`
    - `Next: /duck-execute <plan path> <first affected step ID>` when a related plan and next action are unambiguous;
      use `/duck-plan <specification path>` when no plan exists and the specification is ready; otherwise `Next: none`
      Add details only for unresolved questions, blockers, or verification failures.

Do not modify implementation or referenced context files. Ask instead of guessing when requirements conflict or a
product decision is missing.
