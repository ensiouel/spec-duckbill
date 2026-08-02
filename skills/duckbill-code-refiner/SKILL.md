---
name: duckbill-code-refiner
description: Internal Duckbill module; use only when an active Duckbill command selects preflight, correction of a completed step, or validation of its selected resumed repair under unchanged specification and plan intent. Never use standalone or to change either artifact's intent.
---

# Duckbill Code Refiner

Correct a code defect already governed by unchanged specification and plan intent.

## Required Reference

Read [references/feedback-guide.md](references/feedback-guide.md) before classification or correction.

## Modes

- **Preflight:** perform procedure steps 1–3 without writes or workflow-state access.
- **Correction:** enter only after the active command establishes permission, order, and material readiness; perform
  steps 4–6.

## Procedure

1. Apply the reference classification. Continue only for a defect in one `completed` step or validation of its selected
   resumed repair. Classify already-satisfied feedback as unchanged unless a resumed repair still requires ordered
   criteria and completion; classify every other step outcome or intent level without writes.
2. Read governing requirement IDs, step intent, feedback references, and current implementation.
3. Confirm the expected behavior is already required.
4. Apply the smallest complete correction. Include related files only when required for
   correct behavior/build. Diagnose failures caused by the repair.
5. Re-evaluate every selected-step criterion in exact order.
6. Inspect the final diff and record current evidence.

## Boundaries

- MUST NOT modify specification intent or plan intent and MUST NOT read or change `state.json`.
- Higher-level or material-unknown feedback MUST STOP before all writes.
- Referenced files are context, not edit permission. MUST NOT touch unrelated code or overwrite valid user changes.
- MUST NOT report a criterion as passed when current evidence no longer proves it.
- MUST NOT invoke another module, interact with the user, choose routing, or format a terminal result. The active
  command owns those concerns, workflow-state writes, derived coverage, and plan-level validation.

## Result

Produce a compact internal result with these labels:

- `classification`: `code-defect|already-satisfied|execution-work|plan-level|specification-level|material-unknown`;
- `outcome`: `completed|partial|failed|unchanged|blocked`;
- `defect`: governed behavior violated, or `none`;
- `changedPaths`: sorted repository-relative paths, or `none`;
- `checksRun`: commands or inspections with result and evidence, or `none`;
- `criteria`: every selected-step criterion in plan order as `{id,result,evidence}`;
- `blockers`: conditions that prevented correction or proof, or `none`;
- `unverifiedItems`: skipped or unavailable checks, or `none`;
- `materialUnknowns`: unresolved intent/ownership, or `none`;
- `intentPreserved`: `true|false`.
