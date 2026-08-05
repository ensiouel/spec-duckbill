# Artifact Authoring

## Source priority

Author from higher to lower intent: constitution, specification, technical plan, tasks, then application code. A lower source supplies facts and constraints only when they do not change higher-level intent.

## Specification authoring

Separate product intent from implementation discretion. Write observable actors, scenarios, value, scope, behavior, contracts, data rules, security/privacy rules, acceptance, and outcomes. Preserve stable IDs whose meaning is unchanged. Assign a new ID when meaning changes. Remove resolved questions before `status: ready`.

Do not invent behavior from existing code. Existing code may verify facts or reveal a conflict. A material product decision produces clarification owned by `specification`.

Before returning a ready specification, verify:

- every scenario is independently testable and has value plus acceptance scenarios;
- every normative behavior has an FR or NFR ID;
- acceptance criteria are observable;
- goals, non-goals, requirements, outcomes, and contracts agree;
- no implementation design or unresolved placeholder remains;
- the canonical plan link and feature ID are correct.

## Plan and task authoring

Start only from a deterministic-valid ready specification. Inspect the repository for applicable instructions, module boundaries, existing interfaces, similar code, tests, configuration, and safe commands. Do not guess a current path or symbol. Label a path as new when it does not exist.

Choose the smallest coherent architecture that satisfies the specification. Create plan.md and tasks.md together. Map every US, FR, NFR, and AC through a real plan section and executable task. Map every required ID to feature validation. Preserve the specification's meaning exactly.

Task boundaries follow outcomes. Merge actions that must land together to keep the project buildable. Split outcomes only when they are independently meaningful and dependencies are real. Do not create tasks solely for running a command, editing one file, or writing tests that belong to an implementation outcome.

## Refinement and synchronization

Apply feedback only at the level that owns it. Specification refinement changes WHAT/WHY and leaves plan/tasks untouched and stale. Plan refinement may update plan, tasks, or both but must be rejected in full if the proposal contradicts the specification.

Synchronization consumes a current specification and structured findings. It updates plan and tasks together. When a requirement is removed, inspect the existing behavior before retiring work. Add correction/removal tasks when code still implements behavior that is no longer allowed. Never execute generated work.

Return `affectedTaskIds` as a suggestion. The runtime computes its own affected set and unions both sets.

## Typed result

Every mode returns an object:

```json
{
  "status": "completed",
  "artifacts": {},
  "affectedTaskIds": [],
  "reason": "Concise semantic result"
}
```

When a material decision is missing, return the clarification form from `clarification.md` and make no writes.

