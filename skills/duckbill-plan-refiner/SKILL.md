---
name: duckbill-plan-refiner
description: Refine an existing plan or synchronize it with an updated specification without changing specification or code. Use for plan approach/scope, prerequisites, steps, context, actions, criteria, dependencies, mappings, validation, risks, ordering, or structure.
---

# Duckbill Plan Refiner

Update one plan while preserving an executable sequence and truthful evidence.

This skill MAY update plan intent and required execution state in the selected plan. It MUST preserve `spec-file` and
MUST NOT change specification intent, patches, or implementation code.

## Required Reference

Read [references/refinement-guide.md](references/refinement-guide.md) before changing structure, criteria, dependencies,
mappings, or execution state.

## Procedure

1. Classify before writes. Route specification changes upward. If intent is unchanged and one `completed` step owns a
   code defect, route earlier execution work to `/duck-execute`, otherwise the defect to `/duck-refine-code`.
2. Compare every proposed plan change with the read-only governing specification. Inspect project files only to verify
   relevant facts/conventions.
3. Return material unknowns to the caller before saving; MUST NOT ask directly or partially update state.
4. Select the smallest correct operation from the reference. A change that would retire Current Step while it owns a
   valid Base Tree MUST STOP for patch-ownership recovery.
5. Update affected intent, stable IDs, ID dependencies/mappings, context, Actions, criteria, validation, and risks.
6. Keep execution evidence truthful: reset invalidated checkmarks, mark affected executed steps `stale`, and preserve
   unrelated state. MUST NOT add Execution to an untouched step. If Current Step intent changes, preserve Base Tree and
   set Patch Status `stale`.
7. Re-read and validate links, IDs, derived coverage, dependencies, boundaries, criteria, and execution truth.

## Boundaries

- MAY modify only the selected plan. Referenced files and governing specification are read-only.
- MUST NOT invoke other workflow levels, repair reciprocal links, edit/regenerate patches, or weaken a requirement.
- Invalid links, specification feedback, code defects, material unknowns, and patch-ownership conflicts MUST STOP before
  all writes.
- MUST NOT save assumptions or add a Requirement Coverage table.

## Result

Return preserved/added/retired/stale IDs, mappings, structural changes, and work requiring execution. Plan changes route
to the first manual `/duck-execute`; unchanged intent plus a completed code defect routes to `/duck-refine-code`.
