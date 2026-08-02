---
name: duckbill-plan-refiner
description: Internal Duckbill module; use only when an active Duckbill command selects preflight or refinement of one existing plan, including synchronization with its specification. Never use standalone or to edit specification intent, workflow state, or implementation.
---

# Duckbill Plan Refiner

Update one plan while preserving an executable sequence and stable identity.

This module MAY update plan intent in the selected plan. Preserve `spec-file`; never change specification intent,
workflow state, or implementation.

## Required Reference

Read [references/refinement-guide.md](references/refinement-guide.md) before changing structure, criteria, dependencies,
mappings, or ordering.

## Modes

- **Preflight:** perform procedure steps 1–4 without writes or workflow-state access.
- **Refinement:** enter only after the active command establishes ownership, links, permission, and material readiness;
  perform steps 5–7.

## Procedure

1. Apply the reference classification. Continue only for a plan-level change or synchronization.
2. Compare every proposed plan change with the read-only governing specification. Inspect project files only to verify
   relevant facts/conventions.
3. STOP before saving when a material unknown remains; MUST NOT partially update the plan.
4. Identify every step ID whose implementation or evidence may become invalid, including IDs that may be retired.
5. Apply the smallest complete change using the reference identity, traceability, and structure rules.
6. Separate `affectedStepIds` from changed `PRE|SC|VAL` definition IDs; do not reset evidence or write status.
7. Re-read and run the reference Validation check.

## Boundaries

- MAY modify only the selected plan. Referenced files and governing specification are read-only.
- MUST NOT invoke another module, repair reciprocal links, read or edit workflow state, or weaken a requirement.
- Invalid links, specification feedback, code defects, and material unknowns MUST STOP before all writes.
- MUST NOT save assumptions or add a Requirement Coverage table.
- MUST NOT interact with the user, choose routing, or format a terminal result. The active command owns those concerns
  and state reconciliation after plan validation.

## Result

Produce a compact internal result with these labels:

- `outcome`: `preflight-ready|refined|unchanged|blocked`;
- `classification`: `plan-level|specification-level|code-defect|material-unknown`;
- `affectedStepIds`: IDs whose implementation or evidence may be invalid, or `none`; this is the only set supplied to
  state `sync-plan --affected`;
- `changedDefinitionIds`: added or retired `PRE|SC|VAL` IDs, or `none`;
- `changedMappings`: changed `FR|NFR|AC` mappings, or `none`;
- `structuralChanges`: added, removed, split, merged, or reordered steps, or `none`;
- `materialUnknowns`: unresolved blockers, or `none`.
