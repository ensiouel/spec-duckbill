---
name: duckbill-plan-author
description: Internal Duckbill module; use only when an active Duckbill command selects authoring of a new executable plan from a ready specification or recovery of its reciprocal specification link. Never use standalone or to refine an existing plan.
---

# Duckbill Plan Author

Create a concise executable roadmap from the governing specification.

## Required References

- Always read [references/plan-format.md](references/plan-format.md).
- For Authoring, also read [references/project-analysis.md](references/project-analysis.md) and
  [references/step-design.md](references/step-design.md).

## Modes

- **Metadata recovery:** require the specification's canonical `plan-file` to identify the existing plan; set only that
  plan's `spec-file`, verify everything else byte-for-byte unchanged, and stop. MUST NOT run planning.
- **Authoring:** require an absent target and run the procedure.

## Procedure

1. Extract goals, scope, constraints, decisions, references, and every `FR-`, `NFR-`, `AC-` ID. STOP if an in-scope item
   lacks a unique stable ID; MUST NOT invent requirement IDs.
2. Inspect relevant project scope with `project-analysis.md`; verify facts from the repository.
3. STOP before writes when a material unknown remains. MUST NOT ask the user directly or save assumptions.
4. Choose coarse coherent steps with `step-design.md`; assign stable IDs and earlier-ID dependencies.
5. Map every in-scope requirement/acceptance ID through step `Requirements` or a `VAL-###` item that explicitly names
   every mapped `FR|NFR|AC` ID.
6. Require reciprocal specification `plan-file`. Write only the new plan with `spec-file`; MUST NOT update the spec.
7. Assign stable IDs and write definitions using the format reference.
8. Re-read the specification and plan; run the format and step-design checks.

## Boundaries

- MUST NOT execute the plan or modify specification, code, or tests.
- MUST NOT invent repository facts, commands, paths, dependencies, or requirements.
- MUST NOT create or read workflow state.
- MUST NOT invoke another module, interact with the user, choose routing, or format a terminal result. The active
  command owns those concerns and separate state initialization.

## Phase Outputs

None. The active command verifies the resulting plan directly and owns state initialization and routing.
