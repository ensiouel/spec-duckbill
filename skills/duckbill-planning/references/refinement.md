# Planning Refinement

Before writing:

1. Read the complete current specification.
2. Read the complete current plan and tasks.
3. Classify the feedback by semantic impact.
4. Identify affected planning decisions, tasks, dependencies, coverage, and completed implementations.

If the feedback changes WHAT, WHY, observable behavior, product scope, acceptance, an external product contract, or a
mandatory product constraint, stop. Planning MUST NOT modify artifacts to make product feedback look technical and MUST
NOT modify the specification.

If the feedback remains within HOW or task decomposition:

- update `plan.md`, `tasks.md`, or both as needed;
- preserve unaffected technical decisions and task identities;
- reconcile coverage, dependencies, touchpoints, work, and verification;
- reconsider every affected completed task against current code and upstream artifacts;
- preserve unaffected completed tasks;
- identify new, changed, retired, pending, and still-completed tasks.

For each retired task, apply the artifact contract: remove its entry, reconcile dependents and coverage, and represent
any necessary implementation cleanup as a coherent pending task rather than a new status.

Planning refinement MUST NOT modify code. After completion, report the immediate actionable affected task or
dependency-ready task set. Downstream implementation remains a separate operation.
