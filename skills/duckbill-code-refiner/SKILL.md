---
name: duckbill-code-refiner
description: Correct implementation code from user feedback while keeping the governing specification or plan unchanged. Use after a generated implementation is incomplete or wrong and the specification and plan still represent the intended behavior.
---

# Duckbill Code Refiner

Correct the implementation described by the supplied plan context and feedback.

## Input

Use the unchanged plan, selected or affected step context, current code, user feedback, and explicitly referenced file
ranges supplied by the calling prompt.

## Required Reference

Read [references/feedback-guide.md](references/feedback-guide.md) before deciding whether feedback is code-only,
validating the correction, and applying referenced-line feedback.

## Refinement Procedure

1. Translate the feedback into concrete implementation problems.
2. Read the relevant requirement IDs, plan content, success criteria, referenced files, and current implementation.
3. Confirm that the expected behavior already exists in the governing plan or specification.
4. Prefer the smallest affected code area. Include related files when required for a correct build or behavior.
5. Apply the correction. You MUST NOT modify plan or specification intent.
6. Diagnose and fix failures directly caused by the correction.
7. Re-evaluate and report every success criterion using the required guide.
8. If all implementation steps would be completed by this correction, validate and report every final plan checklist
   item using the required guide.
9. Inspect the final diff.

## Boundaries

- Do not modify the plan or specification.
- Do not change requirement-to-step mappings during code-only refinement.
- If the governing specification or plan does not yet reflect behavior requested by the feedback, stop and report that
  it must be refined first.
- Treat a referenced file as context. Modify it only when the selected step and requested correction require that
  change.
- Do not touch unrelated code.
- Do not overwrite valid user changes merely to recreate a previous generation.
- Do not preserve an old checked criterion when the corrected implementation no longer proves it.

## Result

Report:

- the understood problem;
- files changed;
- checks performed;
- exact ordered evidence for every selected-step success criterion;
- final plan validation when this correction would complete every implementation step;
- evidence for affected requirement coverage status;
- confirmation that specification and plan intent were not modified.
