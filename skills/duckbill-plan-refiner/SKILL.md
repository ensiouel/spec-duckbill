---
name: duckbill-plan-refiner
description: Refine an existing implementation plan from user feedback or synchronize it with an updated specification without changing the specification or source code. Use for focused step changes or whole-plan updates, including splitting, merging, adding, removing, or reordering steps.
---

# Duckbill Plan Refiner

Update one implementation plan while preserving a coherent, executable sequence.

## Input

Use the complete plan, governing specification identified by plan frontmatter `spec-file`, its reciprocal specification
frontmatter `plan-file`, optional target step, feedback, explicitly referenced file ranges, and project instructions
supplied by the calling prompt. Treat the target as the primary focus. Update related plan content only when required to
keep dependencies, mappings, criteria, or execution state coherent.

## Required Reference

Read [references/refinement-guide.md](references/refinement-guide.md) before changing step structure, criteria,
dependencies, or execution state.

## Refinement Procedure

1. Understand the requested change and compare the plan with its governing specification.
2. Inspect referenced project files only when needed to verify facts or current conventions.
3. When the change exposes a material unknown, return it to the calling prompt and stop before saving. Classify whether
   the answer belongs in the specification or plan; do not ask the user directly.
4. Select the smallest correct refinement operation using the required guide.
5. Update the affected plan content. Rewrite, split, merge, add, remove, or reorder steps when required. Preserve stable
   IDs for unchanged outcomes.
6. Update stable IDs, step-level requirement mappings, numbering, ID-based dependencies, context references, actions,
   success criteria, risks, and ID-prefixed validation items affected by the change.
7. Derive requirement coverage from step `Requirements` fields and the Validation Checklist; do not add a Requirement
   Coverage table.
8. Reset changed success criteria to `[ ]`. An affected existing Execution block MUST become `Status: stale` when its
   previous evidence no longer proves the revised step. You MUST NOT add an Execution block to an unexecuted step. Reset
   every `Validation Checklist` item that could be invalidated by the refinement; reset the whole checklist when
   requirements, steps, dependencies, or cross-step behavior change. When `Execution State` exists and refinement
   affects `Current Step`, you MUST preserve its `Base Tree` and set `Patch Status` to `stale`.
9. Preserve valid unrelated steps and their verified execution state. Keep Execution State absent when no step has been
   executed.
10. Re-read the plan and check unique step IDs, derived requirement coverage, dependencies, references, step boundaries,
    criteria, execution truth, and clarification readiness.

## Boundaries

- Do not modify any artifact except the selected implementation plan.
- Preserve `spec-file` and reciprocal `plan-file`. Do not migrate missing or old metadata. Relink only with explicit
  user confirmation.
- Treat referenced files as read-only context unless they are the selected plan.
- Treat the specification as the source of truth when synchronizing.
- Report a conflict instead of silently weakening a specification requirement.
- Do not complete a plan with a material unknown or assumption.

## Result

Report preserved, added, retired, and stale step IDs; requirement mappings; structural changes; and steps needing
implementation or re-execution.
