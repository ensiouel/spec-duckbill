---
name: duckbill-plan-refiner
description: Refine an existing plan or synchronize it with an updated specification without changing specification, operational state, or code. Use for plan approach/scope, prerequisites, steps, context, actions, criteria, dependencies, mappings, validation, risks, ordering, or structure.
---

# Duckbill Plan Refiner

Update one plan while preserving an executable sequence and stable identity.

This skill MAY update plan intent in the selected plan. It MUST preserve `spec-file` and MUST NOT change specification
intent, operational state, or implementation code.

## Required Reference

Read [references/refinement-guide.md](references/refinement-guide.md) before changing structure, criteria, dependencies,
mappings, or ordering.

## Procedure

1. Classify before writes. Continue only for a plan-level change or synchronization; return every other classification
   to the caller without a route or mutation.
2. Compare every proposed plan change with the read-only governing specification. Inspect project files only to verify
   relevant facts/conventions.
3. Return material unknowns to the caller before saving; MUST NOT ask directly or partially update the plan.
4. In preflight, return step IDs that the proposed change may affect or retire; do not receive or inspect workflow
   state.
5. Update affected intent, stable step/check IDs, ID dependencies/mappings, context, Actions, criteria, validation, and
   risks. Preserve an ID only when meaning is unchanged; assign a new `PRE`, `SC`, or `VAL` ID when meaning changes.
6. Return affected step IDs and changed definition IDs. Do not reset evidence or write status; the caller reconciles
   the small external state after validating the plan.
7. Re-read and validate links, IDs, derived coverage, dependencies, boundaries, and criteria.

## Boundaries

- MAY modify only the selected plan. Referenced files and governing specification are read-only.
- MUST NOT invoke another worker, repair reciprocal links, edit state, or weaken a requirement.
- Invalid links, specification feedback, code defects, and material unknowns MUST STOP before all writes.
- MUST NOT save assumptions or add a Requirement Coverage table.

## Result

Return a structured result with preserved/added/retired/affected IDs, mappings, structural changes, and semantic
classification. The caller owns state reconciliation and routing.
