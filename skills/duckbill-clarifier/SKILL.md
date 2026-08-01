---
name: duckbill-clarifier
description: Identify and resolve material specification or plan unknowns before authoring, refinement, or synchronization when different answers could change requirements, scope, contracts, implementation approach, step boundaries, dependencies, risks, or success evidence.
---

# Duckbill Clarifier

Prevent material decisions from becoming assumptions.

## Required Reference

Read [references/clarification-policy.md](references/clarification-policy.md) before a readiness decision.

## Procedure

1. Accept one explicit clarification scope from the caller: `specification`, `plan`, or `both`. Read only the supplied
   artifact paths, feedback, project instructions, and verified context.
2. Investigate repository facts before asking the user.
3. Classify each unknown by the artifact whose meaning would change:
   - `[spec]`: behavior, scope, constraints, contracts, data, security, or acceptance;
   - `[plan]`: approach, paths/symbols, steps, dependencies, commands, rollout, risks, or evidence.
4. Ask only questions material to the current readiness gate. Specification work MUST NOT be blocked by plan-only
   choices. Plan work may require both classes.
5. Ask the smallest focused batch. Show the tag legend once, put the most blocking question first, and briefly compare
   meaningful alternatives.
6. STOP while a material question remains unanswered. MUST NOT invent a default or save competing alternatives.
7. Classify answers by ownership and return that classification to the caller. Do not choose or invoke a follow-up
   operation.
8. If an answer unexpectedly contradicts recorded intent, identify affected IDs/decision and confirm before applying.
   Explicit feedback requesting that change needs no second confirmation.
9. Re-run the affected artifact's readiness gate.

## Result

Return either the tagged question batch and pause, or the affected artifact/IDs and confirmation that no material
unknown remains. Return data only to the caller; do not ask the user directly, edit artifacts, read workflow state,
invoke another worker, or format command routing. The caller owns user interaction, writes, state, and final formatting.
