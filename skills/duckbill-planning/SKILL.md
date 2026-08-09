---
name: duckbill-planning
description: Create or refine Duckbill technical plans and executable task decompositions. Use when deriving HOW from a ready `spec.md`, inspecting repository facts, creating or reconciling `plan.md` and `tasks.md`, or reconsidering completed tasks after upstream change.
---

# Duckbill Planning

## Ownership

Planning owns `plan.md`, `tasks.md`, HOW, and executable task decomposition. Planning MAY modify both planning artifacts
in one operation.

Planning MUST derive design from the current ready specification, verified repository facts, and project instructions.
It MUST NOT modify `spec.md`, application code, or tests. It MUST NOT weaken, broaden, remove, contradict, or silently
reinterpret specification-owned behavior.

If `.duckbill/constitution.md` exists, read and respect it as Duckbill-specific project policy. Its absence MUST NOT
block work. Treat normal Pi project instructions as authoritative context.

## Feature workspace

Resolve the selected feature under the repository root as `.duckbill/specs/<feature>/`, with `spec.md`, `plan.md`, and
`tasks.md` inside it. The feature identifier MUST be one nonempty lowercase kebab-case path segment. Resolved feature
and artifact paths MUST remain inside the repository-local `.duckbill/specs/` directory; stop on traversal, ambiguity,
or symlink escape.

The feature workspace and `spec.md` MUST already exist. Authoring requires a ready specification. Refinement
additionally requires existing `plan.md` and `tasks.md`; otherwise stop without creating or modifying planning
artifacts.

A lower layer MUST NOT redefine a higher one. If feedback changes WHAT, WHY, observable behavior, product scope,
acceptance, an external product contract, or a mandatory product constraint, planning MUST stop and report specification
as the owner.

Staleness is semantic. A plan is outdated only when it no longer represents the current specification; timestamps MUST
NOT determine authority or freshness.

## Readiness

A plan is ready when execution can proceed without inventing significant technical design decisions. Tasks are ready
when each one defines a coherent, independently verifiable implementation outcome with enough context for one focused
coding run.

## Operations and resources

Perform exactly one operation selected by the caller:

- **Author:** Read [the artifact contract](references/artifact-contract.md) and [authoring](references/authoring.md).
  Use [the plan asset](assets/plan.md) and [the tasks asset](assets/tasks.md) as flexible starting points.
- **Refine:** Read [the artifact contract](references/artifact-contract.md) and [refinement](references/refinement.md).

Load only the resources needed for the selected operation.

## Semantic result

Report whether the operation completed or stopped. Identify changed planning decisions, affected tasks, completion-state
changes, and the immediate downstream impact. When stopping, report the semantic owner, reason, and needed change. Do
not depend on or name slash commands.
