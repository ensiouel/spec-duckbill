---
name: duckbill-clarifier
description: Internal Duckbill module; use only when an active Duckbill command needs a specification or plan material-readiness check or answer classification. Never use standalone or to edit artifacts, workflow state, or routing.
---

# Duckbill Clarifier

Prevent material decisions from becoming assumptions.

## Required Reference

Read [references/clarification-policy.md](references/clarification-policy.md) before a readiness decision.

## Modes

- **Readiness:** investigate and classify material unknowns before writes.
- **Answer review:** classify supplied answers, identify conflicts with recorded intent, and re-run readiness.

## Procedure

1. Accept one explicit clarification scope from the active command: `specification`, `plan`, or `both`. Read only the supplied
   artifact paths, feedback, project instructions, and verified context.
2. Investigate repository facts before returning a question.
3. Apply the reference classification to each unknown according to the artifact whose meaning would change.
4. Keep only questions material to the current readiness gate. Specification work MUST NOT be blocked by plan-only
   choices. Plan work may require both classes.
5. Form the smallest focused batch. Show the tag legend once, put the most blocking question first, and briefly compare
   meaningful alternatives. The active command presents it to the user.
6. STOP while a material question remains unanswered. MUST NOT invent a default or save competing alternatives.
7. In answer review, classify each answer by ownership. Do not choose a follow-up operation.
8. If an answer unexpectedly contradicts recorded intent, identify affected IDs/decision and confirm before applying.
   Explicit feedback requesting that change needs no second confirmation.
9. Re-run the affected artifact's readiness gate.

The active command owns user interaction, artifact writes, routing, workflow state, and the terminal result.

## Phase Outputs

- `questions`: ordered tagged questions, or `none`; `none` means the requested scope is materially ready.
- `answerOwnership`: `specification|plan|both|none`.
- `affectedIds`: IDs needed to confirm an unexpected conflict, or `none`.

MUST NOT ask the user directly, edit artifacts, read workflow state, invoke another module, or format routing or a
terminal result.
