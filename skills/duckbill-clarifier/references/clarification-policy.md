# Clarification Policy

## Classification

Classify an unknown by the artifact whose meaning would change, not where it was discovered.

| Class | Material when different answers change |
|---|---|
| specification | behavior/scope, acceptance or failure behavior, data lifecycle/compatibility, contracts, security, or affected application/module |
| plan | implementation approach/architecture, paths/symbols, steps, dependencies, commands, rollout, risks, or implementation evidence |

Specification unknowns block specification readiness. Plan-only alternatives do not. Both classes block plan readiness
when they affect the plan.

## Investigate Before Returning Questions

Read supplied context and inspect only permitted project scope:

- specification facts: existing behavior, contracts, tests, configuration, docs, and project instructions;
- plan facts: relevant implementation architecture, modules, callers, tests, tools, commands, and conventions.

Return questions only for missing intent, a user decision, an inaccessible fact, or a choice the repository cannot
decide. A common default is a recommendation, not permission to assume.

## Questions

- Return 1–5 related, concrete questions; put the blocker first.
- Prefix each with `[spec]` or `[plan]`; show the legend once.
- Briefly compare and recommend among materially different known choices.
- Preserve answers and MUST NOT repeat resolved questions.

Normal form:

```text
[spec] updates the specification; plan synchronization is manual
[plan] updates only the plan

1. [spec] <question>
2. [plan] <question>
```

While a Duckbill command waits for clarification, expose the question batch without a terminal result. The active
command resumes the same flow after the answer and emits a terminal result only at a terminal outcome.

## Ownership

During specification work, return only `[spec]` questions needed for readiness and omit unresolved implementation
alternatives. During plan work, resolve both missing specification intent and material implementation choices.

An active command MAY apply only answers for the level it owns. Otherwise it MUST STOP without writes and route to the
owning refinement command. Applying a specification answer never synchronizes a linked plan in the same command.

Do not store undecided alternatives in a completed artifact. Put intentionally deferred product scope in specification
Non-Goals and deferred implementation work in plan Out of Scope/future work.

## Conflicts

When an answer unexpectedly contradicts recorded intent:

1. identify affected requirement IDs, step IDs, or decision;
2. summarize current → proposed meaning;
3. confirm before changing it.

Skip confirmation when the original feedback explicitly requested the change.

## Material Readiness

This policy decides whether missing intent still requires the user. It does not validate document structure, ID
coverage, traceability, commands, or evidence quality; the owning author/refiner module validates those concerns.

A specification is materially ready when no unresolved product, scope, behavior, constraint, contract, data, security,
failure, or acceptance decision would change specification intent, and verified repository facts do not contradict it.

A plan is materially ready when the specification is materially ready and no unresolved approach, component, path,
step, dependency, command, rollout, risk, or proof choice would materially change plan intent. Repository facts that can
be established by inspection are not questions.
