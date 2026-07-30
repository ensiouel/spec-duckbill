# Plan Refinement Guide

Read this reference before changing a plan's step structure or execution state.

## Select the Operation

- Rewrite a step when its outcome is still correct but its context, actions, or criteria are unclear.
- Split a step when it contains distinct outcomes that can be executed and verified separately.
- Merge steps when they describe one implementation outcome, repeatedly edit the same concern, or one leaves the project
  needlessly broken.
- Add a step when new required work has no existing home.
- Remove a step when its outcome is no longer required.
- Reorder steps only to satisfy a real dependency.

## Preserve Execution Truth

- Preserve unchanged criteria and execution records.
- Reset changed criteria to `[ ]`.
- Reset a criterion when its evidence no longer proves the revised behavior.
- Set an existing Execution block to `Status: stale` when its evidence no longer proves the revised step. Do not add one
  to an unexecuted step.
- If the current step changes semantically, preserve `Base Tree` and set `Patch Status` to `stale`.
- Do not regenerate or edit the patch during plan-only refinement.
- When splitting an executed step, do not copy completed status onto newly defined work.
- When removing the current step, retain the baseline for diagnosis, set the patch stale, and report that a new
  execution target must be selected.

## Preserve Step Identity

- Preserve a step ID when its logical outcome remains the same.
- Renumber or reorder headings without changing IDs.
- Assign unique new IDs to new outcomes.
- Use IDs for dependencies, step-level requirement mappings, and `Current Step`.
- Retire the original ID when a step is split, merged into a different outcome, or removed.
- If a structural change retires the current step ID while a valid `Base Tree` exists, set `Current Step` to
  `retired:<old-id>`, preserve the baseline, mark the patch stale with the structural reason, and stop automatic code
  continuation. Report that the existing implementation patch cannot be safely divided between new steps.
- Report two safe recovery choices: restore one coherent step with the original ID, or explicitly restore implementation
  to `Base Tree` before executing replacement steps. Never perform the restore without user authorization.

## Preserve Requirement Traceability

- Keep requirement and acceptance IDs exactly aligned with the governing specification.
- Update each affected step's `Requirements` field.
- Update each affected step's `Requirements` field after every split, merge, addition, removal, or reorder.
- Preserve mappings for unchanged steps.
- Remove mappings for deleted requirements.
- Add mappings for new requirements before considering synchronization complete.
- Do not invent a requirement or acceptance ID that is absent from the specification.
- Preserve exact ID prefixes on Validation Checklist items and add them when an item provides final-only coverage.
- Do not add a separate coverage table. Derive coverage status from step mappings and current execution evidence when
  reporting.

## Examples

Feedback:

```text
Split password hashing and registration integration. Put hashing in a reusable service.
```

Good result:

```text
Step 1 (`hash-password`): Introduce and verify the password hashing service
Step 2 (`integrate-password-registration`): Integrate password hashing into registration
```

`integrate-password-registration` depends on `hash-password`. Criteria are rewritten and unchecked where their meaning
changed.

Bad result:

```text
Step `create-password-file`: Create file
Step `add-password-method`: Add method
Step `test-password-method`: Add unit test
Step `integrate-password-registration`: Integrate registration
```

The first three items are one coherent capability and should remain one step.

Whole-plan feedback:

```text
specs/plans/user-auth/plan.md#L70-110 Move audit logging after authentication is functional.
```

Read the range and surrounding steps. Reorder only if dependencies allow it. Preserve step IDs and update display
numbers.

## Validation

Confirm:

- the plan still covers the governing specification;
- every step has a distinct outcome;
- step IDs are unique and stable for unchanged outcomes;
- numbering is continuous;
- dependencies reference earlier existing step IDs and contain no cycles;
- file references and commands remain credible;
- criteria match their revised actions;
- every in-scope requirement is mapped to a step or overall validation item;
- execution state and patch status tell the truth.
