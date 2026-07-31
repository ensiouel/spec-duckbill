# Clarification Policy

## Classification

Classify an unknown by the artifact whose meaning would change, not where it was discovered.

| Class | Material when different answers change |
|---|---|
| specification | behavior/scope, acceptance or failure behavior, data lifecycle/compatibility, contracts, security, or affected application/module |
| plan | architecture, paths/symbols, steps, dependencies, commands, rollout, risks, or implementation evidence |

Specification unknowns block specification readiness. Plan-only alternatives do not. Both classes block plan readiness
when they affect the plan.

## Investigate Before Asking

Read supplied context and inspect only permitted project scope:

- specification facts: existing behavior, contracts, tests, configuration, docs, and project instructions;
- plan facts: relevant architecture, modules, callers, tests, tools, commands, and conventions.

Ask only for missing intent, a user decision, an inaccessible fact, or a choice the repository cannot decide. A common
default is a recommendation, not permission to assume.

## Questions

- Ask 1–5 related, concrete questions; put the blocker first.
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

For a strict Duckbill footer, compress the blocker and pause:

```text
Changed: none
Status: blocked; material unknown: <concise question; optional related question>
Next: none
```

## Ownership

During specification work, ask only `[spec]` questions needed for readiness and omit unresolved implementation
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

## Readiness Gates

A specification is ready only when:

- goals, scope, non-goals, behavior, constraints, and acceptance agree;
- each in-scope normative requirement/criterion is testable and has a stable ID;
- Technical Design satisfies the specification format without plan-only detail;
- no material product, contract, data, security, scope, or acceptance decision remains;
- assumptions/alternatives do not hide required intent; verified project conflicts are resolved.

A plan is ready only when:

- the specification passes its gate;
- relevant project code/conventions are inspected;
- every in-scope requirement/acceptance ID is mapped to a step or final validation item;
- scope, approach, prerequisites, steps, dependencies, actions, paths, commands, risks, and evidence are executable;
- existing paths/symbols/commands are verified and future paths labeled;
- no material implementation choice remains in alternatives, `Unknowns`, or assumptions.
