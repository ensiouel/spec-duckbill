# Clarification Policy

## Material Unknowns

Classify an unknown by the artifact whose meaning would change. Do not classify it only by when the question was
discovered.

An unknown is material to a specification when different answers could change one or more of:

- user-visible behavior or scope;
- acceptance criteria or failure behavior;
- data ownership, persistence, migration, or compatibility;
- API, event, file, or integration contracts;
- authentication, authorization, privacy, or other security boundaries;
- affected application or module.

An unknown is material to a plan when different answers could change implementation architecture, step boundaries,
dependencies, rollout, risk, paths, commands, or implementation criteria.

Resolve specification unknowns before marking a specification ready. Implementation alternatives do not block the
specification unless they also change its required behavior or constraints. Resolve plan unknowns before saving a
completed plan.

## Investigate Before Asking

First read user-provided context and inspect the permitted project scope.

- For a specification question, use existing behavior, contracts, tests, configuration, documentation, and project
  instructions to verify product and repository facts.
- For a plan question, inspect the relevant architecture, modules, callers, tests, build tools, commands, and project
  conventions needed to choose an executable approach.

Ask the user only for a decision, missing intent, inaccessible external fact, or choice that the repository cannot
decide.

## Question Style

- Ask one to five related questions at a time.
- Put the most blocking question first.
- Make each question concrete and answerable.
- When alternatives are known, give a short comparison and recommend one.
- Show this legend once before the question batch:
    - `[spec] answer updates the specification and synchronizes the plan`
    - `[plan] answer updates only the plan`
- Prefix every question with `[spec]` or `[plan]`.
- Do not mix unrelated minor preferences into the same batch.
- Preserve earlier answers and do not ask the same question again.

```text
[spec] updates the specification and synchronizes the plan
[plan] updates only the plan

1. [spec] Should recovery links be one-time?
2. [plan] Where should the recovery service live?
```

Pause after asking. Continue the workflow only after the user answers.

## Phase Behavior

While authoring or refining a specification:

- ask `[spec]` questions that block specification readiness;
- do not ask `[plan]` questions merely to make the later plan easier;
- omit unresolved implementation alternatives from the specification instead of recording “chosen during planning.”

While authoring or refining a plan:

- ask `[spec]` when the implementation decision exposes missing or conflicting required behavior;
- ask `[plan]` when the specification permits more than one materially different implementation;
- resolve step boundaries, dependencies, paths, commands, rollout, risk mitigation, and success evidence before marking
  the plan ready.

Route a `[spec]` answer through the specification workflow and synchronize an existing plan afterward. Route a `[plan]`
answer only through the plan workflow. The owning author or refiner skill applies artifact-specific formatting and
content rules.

## Conflicts with Recorded Decisions

Apply an answer directly when it fills a missing decision. When it unexpectedly changes or contradicts an existing
requirement or recorded plan decision:

1. Name the affected `FR-`, `NFR-`, or `AC-` IDs, plan step IDs, or exact recorded decision.
2. Summarize the current and proposed meaning in one short statement.
3. Ask for confirmation before changing the artifact.

Do not request this confirmation when the user's original request or feedback already explicitly asked for the change.

Example:

```text
FR-003: reusable recovery links -> one-time recovery links. Update the specification?
```

```text
Step store-user: write through UserRepository -> write directly through the database client. Update the plan?
```

## Readiness Gate

A specification is ready for planning only when:

- its goals, scope, non-goals, behavior, constraints, and acceptance expectations are consistent;
- every in-scope requirement and acceptance criterion is testable and has a stable ID;
- every normative behavior or constraint stated outside Requirements is represented by a stable requirement ID;
- no material product, scope, contract, data, security, or acceptance decision remains unresolved;
- its Technical Design passes the specification format and authoring rules;
- no unresolved required behavior or constraint is expressed as alternatives deferred to planning;
- assumptions do not hide a material decision;
- conflicts with verified project behavior are resolved.

A plan is ready for execution only when:

- the specification passes the readiness gate;
- related project code and conventions have been investigated;
- every in-scope requirement and acceptance ID is mapped to a step or final validation item;
- implementation scope, approach, prerequisites, step boundaries, dependencies, actions, paths, commands, risks, and
  success evidence are specific enough to execute;
- referenced existing paths, symbols, and commands are verified, and future paths are identified as files to create;
- no material implementation choice is deferred to execution as competing alternatives;
- no material item remains under `Unknowns` or assumptions.

An explicitly deferred idea is not an open question. Put deferred product scope in specification Non-Goals. Put deferred
implementation work in plan Out of Scope or a clearly identified future-work note so it cannot silently affect the
current artifact.
