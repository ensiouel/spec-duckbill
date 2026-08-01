# Specification Refinement Checklist

## Classify First

| Class | Changes | Action |
|---|---|---|
| specification-level | scope, behavior/constraints, contracts, data, security, acceptance, high-level design | refine specification |
| plan-level | implementation approach, steps, Actions, criteria, dependencies, mappings, order | route without writes |
| code defect | code violates correct specification and plan intent | route without writes |
| material unknown | owner or intended behavior is unclear | clarify without writes |

Only specification-level feedback MAY change the specification.

## Trace Effects

Translate feedback into semantic changes, then inspect related sections:

| Changed item | Also inspect |
|---|---|
| goal/non-goal | requirements, scope, testing |
| functional behavior | design, interfaces, data, security, failures, testing |
| constraint | design, operations, testing |
| data lifecycle | interfaces, security, failure behavior, testing |
| interface | requirements, compatibility, errors, testing |
| security | requirements, design, data, testing |

A line reference supplies context only. Update every affected section, not only the named lines.

## Preserve Integrity

- Preserve stable IDs for unchanged meaning. New meaning gets a new unique `FR`, `NFR`, or `AC`; removed IDs are never
  reused.
- Keep Technical Design present and coherent at the high-level boundary.
- Keep supplied technical detail only when it is required specification intent; route discretionary files, symbols,
  libraries, algorithms, Actions, and code structure to the plan.
- Represent every normative behavior/constraint under Requirements with a stable ID.
- MUST NOT defer required behavior as unresolved alternatives.
- Preserve unrelated user intent and omit new implementation choices.

## Final Check

- Feedback is represented as behavior/constraint; all related sections agree.
- Stable IDs, normative coverage, Technical Design, and resolved decisions remain valid.
- Conflicts and material unknowns were resolved before saving.
- Report exact changed requirement IDs and manual plan-synchronization consequences.
- Plan intent, execution state, code, tests, and configuration are unchanged.
