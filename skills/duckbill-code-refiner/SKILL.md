---
name: duckbill-code-refiner
description: Repair a completed step's implementation from feedback while preserving specification and plan intent; the caller may update execution state. Route new, partial, failed, or stale work to execution and higher-level feedback to its owning refinement command.
---

# Duckbill Code Refiner

Correct a code defect already governed by unchanged specification and plan intent.

## Required Reference

Read [references/feedback-guide.md](references/feedback-guide.md) before classification or correction.

## Modes

- **Preflight:** perform classification and read-only checks only. MUST NOT edit files or execution state.
- **Correction:** enter only after the caller passes permissions/order/clarification and prepares an isolated baseline.

## Procedure

1. Apply the reference classification. Continue only for a defect in one `completed` step. Return already-satisfied
   feedback unchanged; route other execution states or intent levels without writes.
2. Read governing requirement IDs, step intent/evidence, feedback references, patch, and current implementation.
3. Confirm the expected behavior is already required.
4. Apply the smallest complete correction from the caller's baseline. Include related files only when required for
   correct behavior/build. Diagnose failures caused by the repair.
5. Re-evaluate every selected-step criterion in exact order. If this repair would complete all steps, also evaluate the
   final Validation Checklist.
6. Inspect the final diff and report current evidence.

## Boundaries

- MUST NOT modify specification intent or plan intent. The caller MAY persist execution state only.
- MUST preserve approach/scope, prerequisite text/order, context, Actions, criteria text/order, dependencies,
  validation definitions, risks, structure, and mappings.
- Higher-level or material-unknown feedback MUST STOP before all writes.
- Referenced files are context, not edit permission. MUST NOT touch unrelated code or overwrite valid user changes.
- MUST NOT preserve a checked criterion that current evidence no longer proves.

## Result

Return the defect, changed files, checks, exact ordered criterion evidence, optional final validation, requirement
coverage, and confirmation that specification and plan intent were unchanged. The calling prompt owns execution-state
writes, patch creation, strict footer, and `Next`.
