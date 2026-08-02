# Plan Refinement Guide

## Classify Before Writing

| Class | Boundary | Result |
|---|---|---|
| `specification-level` | behavior/scope, constraints, contracts, data, security, acceptance, high-level design | stop without writes |
| `plan-level` | approach/scope, prerequisites, steps, Context, Actions, criteria, dependencies, validation, risks, mappings, order/structure | refine plan |
| `code-defect` | implementation violates already-correct intent | stop without writes |
| `material-unknown` | intended result or owner is unclear | stop without writes |

The governing specification is an immutable input. Never invoke another module or produce command routing.

Workflow metadata MUST remain canonical. Invalid metadata blocks all writes; refinement does not repair it.

## Select the Smallest Operation

- Rewrite when the outcome is unchanged but intent is unclear.
- Split distinct independently executable outcomes.
- Merge one outcome that repeatedly edits the same concern or leaves a needless broken state.
- Add required work with no home; remove an unneeded outcome.
- Reorder only for a real dependency.

## Preserve Identity

- Preserve ID while the logical outcome remains; renumber/reorder headings without changing it.
- Assign new IDs to new outcomes. Retire an ID only when removed, split, or merged away.
- During preflight, identify IDs that may be affected or retired; do not read workflow state.

## Keep State External

- Prerequisite, criterion, and validation definitions remain ID-prefixed plain bullets.
- MUST NOT add or edit checkmarks, Execution blocks, attempt data, evidence, or status fields.
- Preserve a `PRE`, `SC`, or `VAL` ID only while meaning is unchanged. Assign a new ID when meaning changes.
- An affected step is one whose implementation or evidence may be invalid after the change, including a retired step.
  Only `affectedStepIds` is supplied to state `sync-plan` after plan validation. Never read or write result records.

## Preserve Traceability

- Keep exact requirement/acceptance IDs aligned with the specification.
- Recompute affected `Requirements` after split/merge/add/remove/reorder; preserve unaffected mappings.
- Remove deleted IDs; map every new ID before synchronization completes; MUST NOT invent IDs.
- A final-only `VAL-###` item MUST explicitly name every mapped `FR`, `NFR`, or `AC` ID. Derive coverage; MUST NOT add a
  table.

## Validation

Confirm complete specification coverage, unique stable IDs, continuous display step numbering, earlier acyclic
dependencies, credible paths/commands, coherent boundaries/criteria, and unchanged specification, state, code, tests,
and configuration. Stable definition IDs MAY contain gaps after retirement.
