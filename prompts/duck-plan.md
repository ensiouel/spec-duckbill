---
description: Create an implementation plan from an existing specification
argument-hint: "<spec-file>"
---

Create an implementation plan from this specification:

- Specification: `$1`

Example: `/duck-plan specs/user-auth.md`

Flow:

1. If the path is empty, show `Usage: /duck-plan <spec-file>` with the example above and stop.
2. Require a repository-relative path to an existing specification. Reject descriptions and line fragments.
3. Read the complete specification and applicable project instructions. For `status: draft`, stop and recommend
   `/duck-spec <spec-file>`. Load `duckbill-clarifier` and require its specification readiness gate to pass; otherwise
   stop and recommend `/duck-refine-spec`.
4. Resolve the target plan:
    - when specification frontmatter contains `plan-file`, require the canonical repository-relative path
      `specs/plans/<name>/plan.md`, validate it, and use it;
    - otherwise derive `specs/plans/<name>/plan.md` and create its parent directory when saving;
    - if the plan exists and has `Execution State`, any step `Execution` block, or any existing step patch, stop without
      changes and recommend `/duck-refine-plan <plan-file> whole <feedback>`;
    - otherwise confirm replacement before overwriting the untouched plan.
5. Load `duckbill-plan-author` to analyze the related project and draft the implementation approach. Collect any
   material unknowns it returns.
6. Use `duckbill-clarifier` before saving. Investigate repository facts first, then ask the user about every material
   unknown. Show its short `[spec]` and `[plan]` legend once and tag every question. Pause for answers and repeat until
   both specification and plan readiness gates pass.
7. Apply answers about required behavior, scope, contracts, data, security, or acceptance to the specification first
   through `duckbill-spec-refiner`. Apply implementation-only answers to the plan. Re-run `duckbill-plan-author` after
   the answers; if either skill discovers another material unknown, return to step 6.
8. Finish and save the plan with repository-relative `spec-file: <spec-file>` as its only managed frontmatter field.
   Update specification frontmatter with `plan-file: <plan-file>` as its only managed field. Do not duplicate either
   link in References.
9. Re-read both files. Require the plan author final validation and both clarifier readiness gates to pass. Verify the
    reciprocal links.
10. End with exactly three concise lines:
    - `Changed: <changed paths or none>`
    - `Status: <ready or blocked, with a short reason>`
    - `Next: /duck-execute <plan path> <first executable step ID>` when unambiguous, otherwise `Next: none`
      When planning answers changed the specification, name the changed requirement IDs in `Status`. Add details only
      for unresolved questions, blockers, or verification failures. Do not execute a step.
