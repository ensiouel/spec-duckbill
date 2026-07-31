# Plan Refinement Guide

## Classify Before Writing

| Class | Boundary | Action |
|---|---|---|
| specification-level | behavior/scope, constraints, contracts, data, security, acceptance, high-level design | STOP; `/duck-refine-spec` |
| plan-level | approach/scope, prerequisite text/order, steps, context, Actions, criteria text/order, dependencies, validation, risks, mappings, order/structure | refine plan |
| code defect | one `completed` step violates correct specification and plan intent | STOP; earlier execution work first, else `/duck-refine-code` |
| material unknown | intended result or owner is unclear | STOP and clarify |

New/unexecuted, `partial`, `failed`, or `stale` work always routes to `/duck-execute` before code repair. The governing
specification is read-only; synchronization means reading its current intent and updating only the plan.

`spec-file` and reciprocal specification `plan-file` MUST remain canonical. Invalid links block all writes and route to
their authoring owner when exact input is known. Refinement MUST NOT relink either file.

## Select the Smallest Operation

- Rewrite when the outcome is unchanged but intent is unclear.
- Split distinct independently executable outcomes.
- Merge one outcome that repeatedly edits the same concern or leaves a needless broken state.
- Add required work with no home; remove an unneeded outcome.
- Reorder only for a real dependency.

## Preserve Identity and Patch Ownership

- Preserve ID while the logical outcome remains; renumber/reorder headings without changing it.
- Assign new IDs to new outcomes. Retire an ID only when removed, split, or merged away.
- Before retiring Current Step while it owns a valid Base Tree, STOP with no writes. The safe choices are: preserve one
  coherent outcome under the current ID, or restore implementation to Base Tree with explicit authorization before
  rerunning refinement.
- MUST NOT restore automatically or persist ambiguous `retired:` state. A pre-existing `retired:<id>` uses the same
  blocked recovery.

## Preserve Execution Truth

- Preserve unchanged criteria/records; uncheck changed criteria and any evidence invalidated by revised intent.
- Uncheck a prerequisite when revised intent invalidates its evidence.
- Mark an affected existing Execution block `stale` when prior evidence no longer proves the step. MUST NOT create one
  for an unexecuted step or copy completion to new split work.
- If Current Step changes semantically, preserve Base Tree and set Patch Status `stale`. MUST NOT edit/rebuild a patch.
- Preserve unrelated state.
- Reset the whole Validation Checklist when changed requirements, steps, dependencies, or cross-step behavior may
  invalidate it; otherwise preserve independently proven items.
- Specification refinement alone never stales state. This later manual synchronization determines affected steps.

## Preserve Traceability

- Keep exact requirement/acceptance IDs aligned with the specification.
- Recompute affected `Requirements` after split/merge/add/remove/reorder; preserve unaffected mappings.
- Remove deleted IDs; map every new ID before synchronization completes; MUST NOT invent IDs.
- Preserve/add exact ID prefixes on final-only validation items. Derive coverage; MUST NOT add a table.

## Validation

Confirm complete specification coverage, unique/stable IDs, continuous numbering, earlier acyclic dependencies,
credible paths/commands, coherent boundaries/criteria, truthful execution/patch state, and unchanged specification,
code, tests, configuration, and patches. Report the first new or stale step for manual `/duck-execute`.
