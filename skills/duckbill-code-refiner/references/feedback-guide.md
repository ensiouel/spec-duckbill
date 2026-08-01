# Code Feedback Guide

## Interpret and Classify

Identify the observed problem, expected governed behavior, affected implementation, and proving evidence. If expected
behavior is absent from governing intent, classify the level before writes.

| Class | Boundary | Result |
|---|---|---|
| code defect | a `completed` step's code violates already-correct specification and plan intent | correct code |
| plan-level change | approach/scope, prerequisite text/order, context, Actions, criteria text/order, dependencies, validation, risks, mappings, or structure must change | stop; return classification |
| specification-level change | scope, behavior/constraints, contracts, data, security, acceptance, or high-level design must change | stop; return classification |
| material unknown | expected behavior or owner cannot be established | stop; return unknown |

MUST STOP without mutations for every non-code class. A new/unexecuted, `partial`, or `failed` step is
execution work; return that classification to the caller even when feedback calls it a defect.

If current code already satisfies governing intent, return unchanged. The worker never updates attempts or state.

Boundary example: “Preserve the original error cause” is code-only when the plan already requires it. “Split hashing
from registration into a reusable service” changes plan intent and requires later manual execution.

## Feedback References

Accept repository paths with optional `#L<line>` or `#L<start>-<end>`. Read the range and enough surrounding context.
A reference is evidence, not edit permission. Source lines are context; inspect the current working tree before making
or proving a change.

## Validation

- Re-run checks related to changed behavior.
- Return each selected-step criterion in plan order as `{id,result,evidence}`. `passed` requires current direct evidence
  for every claim; use only its stable `SC-###` ID as identity.
- Use `completed` only when all criteria pass; `partial` when code changed but proof remains incomplete; `failed` when
  no intended correction was produced.
- Inspect the code diff; report unavailable checks; confirm specification and plan intent unchanged.

The caller owns workflow-state persistence and routing. This worker neither receives another
skill's output nor invokes another worker.
