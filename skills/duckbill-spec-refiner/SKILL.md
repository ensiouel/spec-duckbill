---
name: duckbill-spec-refiner
description:
  Refine an existing technical specification from user feedback without changing its implementation plan or source code.
  Use when requirements, goals, constraints, design decisions, interfaces, or validation expectations must be corrected
  or extended.
---

# Duckbill Spec Refiner

Apply user feedback to one specification and keep it internally consistent.

## Input

Use the complete specification, user feedback, explicitly referenced file ranges, project instructions, and relevant
verified project context supplied by the calling prompt.

## Required Reference

Read [references/refinement-checklist.md](references/refinement-checklist.md) before tracing the effects of feedback.

## Refinement Procedure

1. Understand which requirements or decisions the feedback changes.
2. Classify the change and trace its effects using the required checklist.
3. Inspect referenced project files only when needed to verify facts.
4. Update every affected specification section, not only the text named by the feedback.
5. Apply the specification-integrity rules from the required checklist.
6. Find normative behavior or constraints stated only outside Requirements and add or update the corresponding
   requirement without duplicating its meaning.
7. Preserve unrelated requirements. When feedback introduces or exposes a material unknown, return it to the calling
   prompt and stop before saving. Do not ask the user directly.
8. Remove a temporary `Open Questions` section after all questions are resolved. Re-read the specification and apply the
   final check in the required checklist.

## Boundaries

- Do not modify any artifact except the selected specification.
- Treat referenced files as read-only context unless they are the selected specification.
- Do not invent product decisions that are absent from the feedback or project context.
- Do not complete refinement before the calling prompt confirms clarification readiness.
- Report when the feedback conflicts with an existing requirement.

## Result

Report changed requirement IDs and sections, removed or added scope, resolved decisions, and consequences that the
implementation plan must absorb.
