---
name: duckbill-step-executor
description: Execute exactly one selected step from an implementation plan using supplied specification and repository context. Use when an agent must implement one bounded plan step, validate all of its success criteria, and report actual changes without proceeding to another step.
---

# Duckbill Step Executor

Implement one selected plan step and stop.

## Input

The calling prompt supplies the plan, selected step, relevant specification, user feedback when present, and project
instructions. You MUST treat the selected step as the implementation boundary.

## Required Reference

Read [references/execution-report.md](references/execution-report.md) before validating criteria and reporting the
result.

## Execution Procedure

1. Read the complete selected step, its requirement IDs, and its dependencies.
2. Read referenced context and inspect the current implementation before editing.
3. Confirm that prerequisite work required by the step is present. Report a blocker when it is not.
4. Map actions and criteria to the implementation files and checks they require.
5. Perform the step's actions. Adapt implementation details to the current codebase without expanding the requested
   behavior.
6. Diagnose and fix failures directly caused by this step when the fix stays within its boundary.
7. Validate and report every success criterion using the evidence rules and exact format in `execution-report.md`.
8. When the caller indicates that this result would complete every implementation step, validate the plan using the
   final-validation rules in `execution-report.md`.
9. Inspect the final diff and confirm that reported files actually changed.
10. Classify and report the result using `execution-report.md`.

## Boundaries

- Do not execute another plan step.
- Do not execute the selected step unless every earlier plan step is completed. Report the first incomplete earlier step
  as a blocker.
- Do not modify the plan or specification.
- Do not change requirement-to-step mappings; report a mismatch as a plan problem.
- Do not change unrelated code.
- Do not claim a criterion passed without evidence.
- Do not omit a criterion or preserve an old checked state when the current implementation no longer proves it.
- You MUST NOT run destructive, production, deployment, or irreversible commands unless the user explicitly authorized
  them.
- Do not hide a skipped or unavailable check behind a general success statement.
- Do not create or report the step patch. The calling workflow owns patch creation after execution.

## Result

Return the report defined in the required reference. Include actual created, modified, and deleted files, checks, an
exact ordered result for every step criterion, optional final-plan validation results, blockers, assumptions, and
status.
