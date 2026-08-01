# Plan Refinement Guide

## Classify Before Writing

| Class | Boundary | Skill result |
|---|---|---|
| specification-level | behavior/scope, constraints, contracts, data, security, acceptance, high-level design | stop; return classification |
| plan-level | approach/scope, prerequisites, steps, context, Actions, criteria, dependencies, validation, risks, mappings, order/structure | refine plan |
| code defect | implementation violates already-correct intent | stop; return classification and candidate owner |
| material unknown | intended result or owner is unclear | stop; return the unknown |

The governing specification is an immutable input. This skill does not receive another skill's output, returns no
command route, and never invokes another worker.

Workflow metadata MUST remain canonical. Invalid metadata blocks all writes and is reported to the caller; refinement
does not repair it.

## Select the Smallest Operation

- Rewrite when the outcome is unchanged but intent is unclear.
- Split distinct independently executable outcomes.
- Merge one outcome that repeatedly edits the same concern or leaves a needless broken state.
- Add required work with no home; remove an unneeded outcome.
- Reorder only for a real dependency.

## Preserve Identity

- Preserve ID while the logical outcome remains; renumber/reorder headings without changing it.
- Assign new IDs to new outcomes. Retire an ID only when removed, split, or merged away.
- During preflight, report IDs that may be affected or retired; do not read or receive workflow state.

## Keep State External

- Prerequisite, criterion, and validation definitions remain ID-prefixed plain bullets.
- MUST NOT add or edit checkmarks, Execution blocks, attempt data, evidence, or status fields.
- Preserve a `PRE`, `SC`, or `VAL` ID only while meaning is unchanged. Assign a new ID when meaning changes.
- Return changed definitions and affected step IDs. Orchestration resets affected state after the plan passes
  validation; this worker never reads or writes result records.

## Preserve Traceability

- Keep exact requirement/acceptance IDs aligned with the specification.
- Recompute affected `Requirements` after split/merge/add/remove/reorder; preserve unaffected mappings.
- Remove deleted IDs; map every new ID before synchronization completes; MUST NOT invent IDs.
- Preserve/add exact ID prefixes on final-only validation items. Derive coverage; MUST NOT add a table.

## Validation

Confirm complete specification coverage, unique/stable IDs, continuous numbering, earlier acyclic dependencies,
credible paths/commands, coherent boundaries/criteria, and unchanged specification, state, code, tests, and
configuration. Return affected IDs and classification to the caller.
