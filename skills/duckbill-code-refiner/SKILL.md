---
name: duckbill-code-refiner
description: Repair a completed step's implementation from feedback while preserving specification and plan intent; the caller may update execution state. Route pending, partial, or failed work to execution and higher-level feedback to its owning refinement command.
---

# Duckbill Code Refiner

Correct a code defect already governed by unchanged specification and plan intent.

## Required Reference

Read [references/feedback-guide.md](references/feedback-guide.md) before classification or correction.

## Modes

- **Preflight:** perform classification and read-only checks only. MUST NOT edit files or execution state.
- **Correction:** enter only after the caller independently confirms permissions, order, and clarification readiness.

## Procedure

1. Apply the reference classification. Continue only for a defect in one `completed` step. Return already-satisfied
   feedback unchanged; route other execution states or intent levels without writes.
2. Read governing requirement IDs, step intent, feedback references, and current implementation.
3. Confirm the expected behavior is already required.
4. Apply the smallest complete correction. Include related files only when required for
   correct behavior/build. Diagnose failures caused by the repair.
5. Re-evaluate every selected-step criterion in exact order.
6. Inspect the final diff and report current evidence.

## Boundaries

- MUST NOT modify specification intent or plan intent and MUST NOT read or change `state.json`.
- MUST preserve approach/scope, prerequisite text/order, context, Actions, criteria text/order, dependencies,
  validation definitions, risks, structure, and mappings.
- Higher-level or material-unknown feedback MUST STOP before all writes.
- Referenced files are context, not edit permission. MUST NOT touch unrelated code or overwrite valid user changes.
- MUST NOT report a criterion as passed when current evidence no longer proves it.
- MUST NOT invoke another worker or choose a follow-up command. Return only to the caller.

## Result

Return the defect, changed files, checks, complete ordered evidence keyed by stable criterion ID, and confirmation that
specification and plan intent were unchanged. The calling prompt owns execution-state writes, derived requirement
coverage, plan-level validation, strict footer, and `Next`.
