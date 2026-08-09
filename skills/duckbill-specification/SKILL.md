---
name: duckbill-specification
description: Initialize, author, refine, or analyze Duckbill feature specifications. Use when creating a Duckbill `spec.md`, deciding planning readiness, changing product WHAT or WHY, or reviewing specification quality without modifying downstream artifacts.
---

# Duckbill Specification

## Ownership

Specification owns `spec.md` and the feature's authoritative WHAT and WHY: intent, product scope, observable behavior,
acceptance, external product contracts, and mandatory product constraints.

Specification MUST NOT modify `plan.md`, `tasks.md`, application code, or tests. Analyze is read-only. Initialize,
author, and refine MAY modify only the selected `spec.md` and, during initialization, its parent feature directories.

The authority order is specification → plan → tasks → code. Lower layers MUST NOT redefine, weaken, broaden, or
contradict specification meaning.

If `.duckbill/constitution.md` exists, read and respect it as Duckbill-specific project policy. Its absence MUST NOT
block work. Also respect the project instructions Pi supplies and use repository facts as evidence; existing code MUST
NOT become product authority merely because it exists.

## Feature workspace

Resolve the selected feature under the repository root as `.duckbill/specs/<feature>/spec.md`. The feature identifier
MUST be one nonempty lowercase kebab-case path segment. The resolved feature directory and artifact MUST remain inside
the repository-local `.duckbill/specs/` directory; stop on traversal, ambiguity, or symlink escape.

Every operation except initialize MUST find the existing feature workspace and `spec.md`; otherwise stop without
creating or modifying anything. Initialize MUST stop rather than overwrite an existing feature workspace.

## Readiness

A specification is ready when planning can continue without inventing material product decisions. A ready specification
MUST NOT contain unresolved material product decisions. When authoritative input cannot resolve one, keep the
specification draft, record the decision still needed in the relevant part of `spec.md`, and ask a focused clarification
question instead of guessing.

## Operations and resources

Perform exactly one operation selected by the caller:

- **Initialize:** Read [initialization](references/initialization.md) and
  instantiate [the draft asset](assets/spec-draft.md).
- **Author:** Read [the specification contract](references/specification-contract.md)
  and [authoring](references/authoring.md). Use [the ready specification asset](assets/spec-ready.md) as a flexible
  starting point.
- **Refine:** Read [the specification contract](references/specification-contract.md)
  and [refinement](references/refinement.md).
- **Analyze:** Read [the specification contract](references/specification-contract.md)
  and [analysis](references/analysis.md).

Load only the resources needed for the selected operation.

## Semantic result

Report whether the operation completed or stopped. For successful mutations, identify changed requirements or acceptance
criteria and downstream planning impact. For a stopped operation, report the semantic owner, reason, and needed change.
Do not depend on or name a slash command; navigation belongs to the command layer.
