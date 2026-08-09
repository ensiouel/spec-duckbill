---
name: duckbill-execution
description: Execute or refine one explicit Duckbill implementation task. Use when implementing application code and tests under the current specification, plan, and `tasks.md`, verifying dependencies and outcomes, updating one task's completion state, or escalating feedback that belongs to planning or specification.
---

# Duckbill Execution

## Ownership

Execution owns implementation within established upstream meaning. It MAY modify application code, tests, configuration
needed by the selected task, and the selected task's completion state.

Execution MUST treat the complete specification, plan, and selected task as authoritative upstream inputs. It MUST NOT
modify `spec.md` or `plan.md`, redefine planning decisions, or redefine specification-owned behavior. It MUST preserve
unrelated work.

If `.duckbill/constitution.md` exists, read and respect it as Duckbill-specific project policy. Its absence MUST NOT
block work. Also respect normal Pi project instructions.

## Feature workspace

Resolve the selected feature under the repository root as `.duckbill/specs/<feature>/`, containing `spec.md`, `plan.md`,
and `tasks.md`. The feature identifier MUST be one nonempty lowercase kebab-case path segment. Resolved feature and
artifact paths MUST remain inside the repository-local `.duckbill/specs/` directory; stop on traversal, ambiguity,
symlink escape, or a missing required artifact.

## Upstream boundaries

Before modifying code, classify the requested work by semantic impact:

- If it fits the selected task, plan, and specification, execution owns it.
- If it changes architecture, component responsibility, integration, persistence, dependencies, task decomposition, or
  another technical design decision, planning owns it.
- If it changes observable behavior, product scope, acceptance, an external product contract, a mandatory product
  constraint, WHAT, or WHY, specification owns it.

If an unresolved upstream decision is needed, execution MUST stop before modifying code. It MUST report the owner,
reason, and needed change. Scope or small diff size MUST NOT override semantic ownership.

## Operations and resources

Perform exactly one operation selected by the caller:

- **Execute:** Read [ownership classification](references/ownership.md) and [task work](references/task-work.md), then
  implement exactly the explicit selected pending task. This operation MUST stop if the selected task is already
  completed.
- **Refine:** Read [ownership classification](references/ownership.md) and [task work](references/task-work.md), then
  evaluate and apply feedback only if execution owns it. The selected task MAY already be completed; completed status
  alone MUST NOT stop this operation.

Execution MUST NOT select another task or start downstream validation.

## Completion

Mark the selected task `completed` only when current implementation and verification justify the current task definition
and upstream artifacts. Otherwise leave or return it to `pending` and explain what remains.

Report whether the operation completed or stopped, changed files, verification evidence, task status, and any upstream
owner. Do not depend on or name slash commands.
