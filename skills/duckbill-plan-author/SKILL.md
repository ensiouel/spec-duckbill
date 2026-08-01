---
name: duckbill-plan-author
description: Create a new executable plan from a ready technical specification, or restore only an existing plan's reciprocal specification link. Use after specification authoring to map stable requirements into verified, coherent steps; existing plan refinement is outside this skill's scope.
---

# Duckbill Plan Author

Create a concise executable roadmap from the governing specification.

## Required References

- Always read [references/plan-format.md](references/plan-format.md).
- For a new plan, also read [references/project-analysis.md](references/project-analysis.md) and
  [references/step-design.md](references/step-design.md).

## Modes

- **Metadata recovery:** require the specification's canonical `plan-file` to identify the existing plan; set only that
  plan's `spec-file`, verify everything else byte-for-byte unchanged, and return. MUST NOT run planning.
- **New plan:** require an absent target and run the procedure.

## Procedure

1. Extract goals, scope, constraints, decisions, references, and every `FR-`, `NFR-`, `AC-` ID. STOP if an in-scope item
   lacks a unique stable ID; MUST NOT invent requirement IDs.
2. Inspect relevant project scope with `project-analysis.md`; verify facts from the repository.
3. Return material unknowns to the caller before writes. MUST NOT ask the user directly or save assumptions.
4. Choose coarse coherent steps with `step-design.md`; assign stable IDs and earlier-ID dependencies.
5. Map every in-scope requirement/acceptance ID through step `Requirements` or an ID-prefixed final validation item.
6. Require reciprocal specification `plan-file`. Write only the new plan with `spec-file`; MUST NOT update the spec.
7. Assign globally unique stable IDs to every present `PRE-###`, `SC-###`, and `VAL-###` definition. Use `None.` instead
   of inventing a prerequisite when none exists. Write independently provable definitions as plain bullets. Split
   unrelated claims and include negative/edge evidence where a boundary requires it. MUST NOT write checkboxes or
   result records.
8. Prefer verified paths/symbols over snippets. Re-read the specification and plan; validate IDs, coverage,
   dependencies, boundaries, paths, commands, risks, criteria, and absent embedded execution state.

## Boundaries

- MUST NOT execute the plan or modify specification, code, or tests.
- MUST NOT invent repository facts, commands, paths, dependencies, or requirements.
- MUST NOT create separate setup/verification/docs steps when part of a coherent implementation step.
- MUST NOT create Project Context or Requirement Coverage sections.

## Result

Return plan path, scope, derived coverage, step count, resolved decisions, and first executable step ID. Confirm that no
embedded execution state was created; the orchestration caller owns separate state initialization. Metadata recovery
reports only the backlink and preservation result.
