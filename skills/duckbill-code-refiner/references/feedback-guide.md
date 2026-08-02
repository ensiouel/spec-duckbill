# Code Feedback Guide

## Interpret and Classify

Identify the observed problem, expected governed behavior, affected implementation, and proving evidence. If expected
behavior is absent from governing intent, classify the level before writes.

| Class | Boundary | Result |
|---|---|---|
| `code-defect` | a `completed` step's code violates already-correct specification and plan intent | correct code |
| `execution-work` | the step is new/unexecuted, `partial`, or `failed` | stop without writes |
| `plan-level` | approach/scope, prerequisite text/order, Context, Actions, criteria text/order, dependencies, validation, risks, mappings, or structure must change | stop without writes |
| `specification-level` | scope, behavior/constraints, contracts, data, security, acceptance, or high-level design must change | stop without writes |
| `material-unknown` | expected behavior or owner cannot be established | stop without writes |

MUST STOP without mutations for every non-code class, even when feedback calls `execution-work` a defect.

A selected `currentOperation: repair` remains code-refiner work although its open attempt temporarily has no completed
outcome. Require explicit feedback again and continue only for that same selected step.

If current code already satisfies governing intent, classify it as `already-satisfied` and keep it unchanged. A
selected resumed repair still evaluates every criterion so the active command can finish its open attempt. Never update
attempts or workflow state.

Boundary example: “Preserve the original error cause” is code-only when the plan already requires it. “Split hashing
from registration into a reusable service” changes plan intent and requires later manual execution.

## Feedback References

Accept repository paths with optional `#L<line>` or `#L<start>-<end>`. Read the range and enough surrounding context.
A reference is evidence, not edit permission. Source lines are context; inspect the current working tree before making
or proving a change.

## Validation

- Re-run checks related to changed behavior.
- Record each selected-step criterion in plan order as `{id,result,evidence}`. `passed` requires current direct evidence
  for every claim; use only its stable `SC-###` ID as identity.
- Use `completed` only when all criteria pass; `partial` when code changed but proof remains incomplete; `failed` when
  no intended correction was produced.
- Inspect the code diff; record unavailable checks; confirm specification and plan intent unchanged.

The active command owns workflow-state persistence, routing, and the terminal result. Never invoke another module.
