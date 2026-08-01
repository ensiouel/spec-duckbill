---
name: duckbill-step-executor
description: Execute exactly one ordered plan step using its governing specification and repository context. Use to implement one bounded step, prove every selected-step success criterion, and stop before another step.
---

# Duckbill Step Executor

Implement one selected step and stop.

## Required Reference

Read [references/execution-report.md](references/execution-report.md) before validation or reporting.

## Modes

- **Preflight:** perform procedure steps 1–3 and boundary classification read-only. MUST NOT perform Actions or change
  state, code, tests, or configuration.
- **Execution:** enter only after the caller independently confirms permissions, order, prerequisites, dependencies,
  and clarification readiness.

## Procedure

1. Read the caller-selected step, requirement IDs, dependencies, governing specification, and project instructions.
2. Inspect referenced context and current implementation.
3. Map Actions/criteria to required files and checks; return specification- or plan-level mismatches before writes.
4. Perform only this step's Actions. Adapt implementation detail to current code without expanding behavior.
5. Diagnose/fix failures caused by this step when the fix remains inside its boundary.
6. Evaluate every selected-step criterion with the reference evidence rules.
7. Inspect the final diff, confirm actual changed files, and classify the result.

## Boundaries

- MUST execute exactly one step in order; MUST NOT modify specification intent or plan intent.
- MUST NOT read or change `state.json`. The caller owns all workflow-state transitions.
- MUST NOT change approach/scope, prerequisite text/order, context, Actions, criteria text/order, dependencies,
  validation definitions, risks, structure, or mappings.
- MUST NOT touch unrelated code, omit a criterion, reuse stale evidence, or claim success without direct proof.
- MUST report skipped/unavailable checks.
- MUST NOT run destructive, production, deployment, or irreversible commands without explicit user authorization.
- MUST NOT invoke another worker or choose a follow-up command. Return only to the caller.

## Result

Return the reference report with actual files, checks, complete ordered evidence keyed by stable criterion ID,
blockers/assumptions, and `completed|partial|failed`. The caller owns state persistence, derived requirement coverage,
plan-level validation, footer, and `Next`.
