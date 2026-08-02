---
name: duckbill-step-executor
description: Internal Duckbill module; use only when an active Duckbill command selects preflight or execution of one ordered plan step under unchanged specification and plan intent. Never use standalone or to change either artifact's intent.
---

# Duckbill Step Executor

Implement one selected step and stop.

## Required Reference

Read [references/execution-evidence.md](references/execution-evidence.md) before boundary classification or validation.

## Modes

- **Preflight:** perform procedure steps 1–3 and boundary classification read-only. MUST NOT perform Actions or change
  workflow state, code, tests, or configuration.
- **Execution:** enter only after the active command establishes permission, order, prerequisites, dependencies, and
  material readiness; perform steps 4–7.

## Procedure

1. Read the selected step, requirement IDs, dependencies, governing specification, and project instructions.
2. Inspect referenced context and current implementation.
3. Map Actions and criteria to required files/checks; STOP before writes for every non-execution classification.
4. Perform only this step's Actions. Adapt implementation detail to current code without expanding behavior.
5. Diagnose/fix failures caused by this step when the fix remains inside its boundary.
6. Evaluate every selected-step criterion with the reference evidence rules.
7. Inspect the final diff, confirm actual changed files, and classify the result.

## Boundaries

- MUST execute exactly one step in order; MUST NOT modify specification intent or plan intent.
- MUST NOT read or change `state.json` or any workflow state.
- MUST NOT touch unrelated code, omit a criterion, reuse stale evidence, or claim success without direct proof.
- MUST record skipped/unavailable checks.
- MUST NOT run destructive, production, deployment, or irreversible commands without explicit user authorization.
- MUST NOT invoke another module, interact with the user, choose routing, or format a terminal result. The active
  command owns those concerns, workflow-state persistence, derived coverage, and plan-level validation.

## Result

Produce the compact internal result defined by the reference. Never produce a standalone Markdown report.
