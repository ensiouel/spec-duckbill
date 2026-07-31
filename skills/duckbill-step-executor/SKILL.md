---
name: duckbill-step-executor
description: Execute exactly one ordered plan step using its governing specification and repository context. Use to implement one bounded step, prove every success criterion, optionally run final plan validation, and stop before another step.
---

# Duckbill Step Executor

Implement one selected step and stop.

## Required Reference

Read [references/execution-report.md](references/execution-report.md) before validation or reporting.

## Modes

- **Preflight:** perform procedure steps 1–4 and boundary classification read-only. MUST NOT perform Actions or change
  state, code, tests, configuration, or patches.
- **Execution:** enter only after the caller passes permissions, order, prerequisites, dependencies, and clarification.

## Procedure

1. Read the complete step, requirement IDs, dependencies, governing specification, and project instructions.
2. Inspect referenced context and current implementation.
3. Verify prerequisites and all earlier steps. Return the first blocker; MUST NOT skip earlier work.
4. Map Actions/criteria to required files and checks; return specification- or plan-level mismatches before writes.
5. Perform only this step's Actions. Adapt implementation detail to current code without expanding behavior.
6. Diagnose/fix failures caused by this step when the fix remains inside its boundary.
7. Evaluate every criterion with the reference evidence rules.
8. When this would complete all implementation steps, run every final checklist item. MUST NOT edit another step to
   make it pass; classify the owner for the caller.
9. Inspect the final diff, confirm actual changed files, and classify the result.

## Boundaries

- MUST execute exactly one step in order; MUST NOT modify specification intent or plan intent.
- The caller MAY persist execution state but owns patch creation.
- MUST NOT change approach/scope, prerequisite text/order, context, Actions, criteria text/order, dependencies,
  validation definitions, risks, structure, or mappings.
- MUST NOT touch unrelated code, omit a criterion, reuse stale evidence, or claim success without direct proof.
- MUST report skipped/unavailable checks.
- MUST NOT run destructive, production, deployment, or irreversible commands without explicit user authorization.

## Result

Return the reference report with actual files, checks, exact ordered criterion evidence, optional final validation,
coverage, blockers/assumptions, and `completed|partial|failed`. The caller owns state persistence, patch, footer, and
`Next`.
