# Planning Artifact Contract

## Technical plan

`plan.md` represents technical design. It MUST optimize for execution readiness instead of document taxonomy and SHOULD
answer:

1. What technical approach is chosen?
2. What changes in the current system?
3. Where do those changes occur?
4. What important technical decisions were made?
5. How will implementation be verified?
6. What material risks or compatibility concerns exist?

A useful default structure is Approach, Changes, Technical Decisions when relevant, Risks when relevant, and
Verification. `Changes` SHOULD use feature-specific headings such as the actual service, screen, client, schema, or read
path. Empty headings MUST NOT be created merely to satisfy a template.

The plan MUST use verified existing paths and symbols. Mark proposed paths or components as new. It SHOULD choose the
smallest coherent design that satisfies the specification and SHOULD NOT introduce speculative architecture to populate
a section.

Do not add generic requirement-to-section mapping. Traceability belongs primarily in executable task coverage.

## Executable tasks

`tasks.md` represents implementation work separately from the plan. Each task MUST communicate:

- identity using `T1`, `T2`, and so on;
- status using only `pending` or `completed`;
- dependencies by task ID or `none`;
- coverage using relevant `R` and `A` IDs;
- verified or explicitly new touchpoints;
- coherent work;
- observable verification.

Task dependencies MUST name existing tasks and MUST NOT form a cycle. Task IDs SHOULD remain stable while conceptual
identity remains unchanged.

A task MUST be a coherent, independently verifiable implementation outcome. It SHOULD fit one focused coding-agent run
and leave the repository coherent. It SHOULD NOT exist solely to edit one file, create one symbol, run one command, or
add tests that naturally belong to the same implementation outcome. It SHOULD NOT contain an entire large feature when
meaningful independent outcomes exist.

Keep verification directly on each task. Do not create separate prerequisite, check, or feature-validation ID systems.

## Completion semantics

`completed` means the current implementation satisfies the current task definition and current upstream artifacts. It is
not immutable history.

After upstream or task change, reconsider affected completed tasks:

- unaffected → remain completed;
- definition changed but implementation still satisfies it → remain completed;
- implementation work is now needed → return to pending.

Unaffected completed tasks SHOULD remain completed.

## Retiring tasks

Retirement is reconciliation, not a third task status. Remove a task whose implementation outcome no longer belongs in
the current plan; do not write `Status: retired`. Update or remove every dependency and coverage claim that referred to
it. A removed task ID MUST NOT be reassigned to a different outcome during the reconciliation.

Removing a task does not assert that its code disappeared. If existing implementation from the removed outcome must
change, create or update a coherent `pending` task that owns that cleanup. If no implementation work remains, no
replacement task is needed.
