# Code Feedback Guide

## Interpret and Classify

Identify the observed problem, expected governed behavior, affected implementation, and proving evidence. If expected
behavior is absent from governing intent, classify the level before writes.

| Class | Boundary | Route |
|---|---|---|
| code defect | a `completed` step's code violates already-correct specification and plan intent | `/duck-refine-code` |
| plan-level change | approach/scope, prerequisite text/order, context, Actions, criteria text/order, dependencies, validation, risks, mappings, or structure must change | `/duck-refine-plan` |
| specification-level change | scope, behavior/constraints, contracts, data, security, acceptance, or high-level design must change | `/duck-refine-spec` |
| material unknown | expected behavior or owner cannot be established | clarify |

MUST STOP without mutations for every non-code class. A new/unexecuted, `partial`, `failed`, or `stale` step is
execution work and MUST route to `/duck-execute`, even when feedback calls it a defect.

If current code already satisfies governing intent, return unchanged. MUST NOT create/increment an Attempt or rebuild a
patch.

Boundary example: “Preserve the original error cause” is code-only when the plan already requires it. “Split hashing
from registration into a reusable service” changes plan intent and requires later manual execution.

## Feedback References

Accept repository paths with optional `#L<line>` or `#L<start>-<end>`. Read the range and enough surrounding context.
A reference is evidence, not edit permission. Patch lines show the selected step result from its baseline; source lines
show the current working tree. Inspect both when they disagree.

## Validation

- Re-run checks related to changed behavior.
- Return each selected-step criterion in exact wording/order; `[x]` requires current direct evidence for every claim.
- Use `completed` only when all criteria pass; `partial` when code changed but proof remains incomplete; `failed` when
  no intended correction was produced.
- If all implementation steps would be complete, evaluate every final checklist item against the combined result.
- Inspect the code diff; report unavailable checks; confirm specification and plan intent unchanged.

The caller owns execution-state persistence and patch regeneration.
