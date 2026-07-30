---
name: duckbill-plan-author
description: Create or substantially rewrite an executable implementation plan from an existing technical specification. Use after specification authoring when requirements must be mapped to coherent implementation steps with verified project context, dependencies, actions, and measurable success criteria.
---

# Duckbill Plan Author

Turn the supplied source of truth into a concise implementation roadmap.

## Input

Use the existing specification and target paths supplied by the calling prompt. Treat the specification as the source of
truth.

## Required References

- Read [references/plan-format.md](references/plan-format.md) before creating or substantially rewriting a plan.
- Read [references/project-analysis.md](references/project-analysis.md) before choosing implementation paths and
  commands.
- Read [references/step-design.md](references/step-design.md) before choosing the final step boundaries.

## Planning Procedure

1. Extract `FR-`, `NFR-`, and `AC-` IDs, goals, scope, constraints, decisions, and references from the specification.
   Stop when an in-scope item lacks a unique stable ID; do not invent plan-only IDs.
2. Analyze the related project scope using the required project-analysis reference.
3. Resolve repository facts through inspection. Return every remaining material unknown to the calling prompt and stop
   before writing the final plan. Do not ask the user directly.
4. Prefer coarse, coherent step boundaries. Assign stable step IDs and define dependencies by ID.
5. You MUST map every in-scope requirement and acceptance ID through step `Requirements` fields or explicit ID prefixes
   in the final Validation Checklist.
6. Write the plan using the required format with repository-relative frontmatter `spec-file`. Tell the calling prompt to
   store the reciprocal path in specification frontmatter `plan-file`.
7. Write success criteria as independently provable outcomes. Split unrelated claims; when one criterion must contain
   several clauses, make each clause and its evidence explicit.
8. Choose evidence that checks the claimed behavior and could reveal its violation. Include a suitable negative or edge
   scenario when the criterion covers a boundary or protective behavior.
9. Start every success criterion unchecked. Execution prompts own verification status.
10. Prefer verified file and symbol references over implementation snippets.
11. Re-read the specification and confirm complete requirement coverage without extra behavior.
12. Validate unique step IDs, traceability, numbering, dependencies, buildable boundaries, paths, commands, criteria,
    risks, and the clean initial execution state.

## Boundaries

- Do not pad the plan with separate setup, verification, or documentation steps when those actions belong inside another
  step.
- Do not repeat the same file changes across steps without a real dependency.
- Do not execute the plan.
- Do not invent repository facts, paths, commands, or requirements.
- You MUST NOT save a completed plan with a material unknown or assumption.
- Do not create a plan from a description or source file without a governing specification.
- Do not create Project Context or Requirement Coverage sections.

## Result

Return the plan path, affected scope, derived requirement coverage, step count, resolved decisions, and the first
executable step ID.
