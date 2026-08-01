# Spec Duckbill

Spec Duckbill is a Pi package for a manually advanced, spec-driven workflow:

```text
specification -> plan -> one step at a time -> validation
```

Each command changes one semantic level plus its mechanical workflow state, verifies the result, recommends one `Next`
action, and stops. The user starts every transition; recommendations never run automatically.

## Installation

```bash
pi install https://github.com/ensiouel/spec-duckbill
```

For a project-local install use `pi install -l https://github.com/ensiouel/spec-duckbill`. For local development use
`pi install .`. Install the repository as one Pi package; copying individual `skills/duckbill-*` directories is not a
supported Duckbill installation because the commands and state runtime are package resources.

Requirements: Pi, Node.js 20+, and Git. Keep plan-local `state.json` tracked in Git.

## Quick Start

```text
/duck-init Password Authentication
/duck-spec specs/password-authentication.md
/duck-plan specs/password-authentication.md
/duck-execute specs/plans/password-authentication/plan.md hash-password
```

Replace the draft's `[WRITE HERE]` line before `/duck-spec`.

Every command returns exactly:

```text
Changed: <changed files or none>
Status: <result and reason>
Next: <one exact Duckbill command or none>
```

## Sources of truth

| Concern | Source | Owner |
|---|---|---|
| required behavior and decisions | `specs/<name>.md` | specification commands |
| implementation sequence and proof definitions | `specs/plans/<name>/plan.md` | plan commands |
| current progress and evidence | `specs/plans/<name>/state.json` | deterministic state CLI through orchestration |
| implementation | project code, tests, and configuration | execution/repair commands |
| history | Git | project workflow |

The plan contains stable `PRE-###`, `SC-###`, and `VAL-###` definitions. It does not contain checkmarks, attempts,
status, or evidence. `state.json` refers to those IDs and stores only:

- the schema version and current specification/plan hashes;
- one optional running step;
- attempts and step outcomes;
- prerequisite, criterion, and validation evidence.

Current routing, completeness, coverage, and changed files are computed when needed. They are not stored twice.

## Simple state protocol

The workflow assumes a single writer and one running command. There are no state revisions, locks, event logs,
baselines, or background transitions. Every state write validates the whole file and replaces it atomically.

Normal orchestration uses six operations:

```text
read -> init | record | begin -> finish | sync-plan
```

Commands load `duckbill-state` independently and invoke its bundled `scripts/state.mjs` with `--plan <plan-file>` and
`--repo <repository-root>` plus the explicit IDs, mode, outcome, scope, affected IDs, or evidence required by that
operation.

- `read` returns a compact summary and, when requested, one step's evidence. Write operations return small receipts,
  not the complete state object.
- `init` creates state for a new clean plan.
- `record` replaces the complete prerequisite or final-validation evidence set.
- `begin` opens one sequential execution or repair attempt.
- `finish` records its outcome and the complete selected-step criterion evidence set.
- `sync-plan` reconciles state after a semantically validated plan change.

Specification or plan content hash changes block execution until the plan is synchronized. Reciprocal `plan-file` and
`spec-file` metadata are excluded from those hashes. A plan refiner reports affected step IDs; deterministic code
resets only those steps and any completed step whose criterion IDs no longer match.

Persisted outcomes are `completed | partial | failed`. Check results are `passed | failed | blocked`. `running`, the
first pending step, and overall completion are derived.

An interrupted attempt is resumed through `/duck-execute` from canonical specification and plan intent. The state does
not store prompts, feedback text, or an AI conversation.

## Skill isolation

Commands orchestrate; skills do not form a call graph.

- A skill never invokes, imports, reads, or names another skill.
- A semantic worker receives canonical project artifacts and resolved user input, not another worker's report or state.
- Orchestration owns routing and normalizes proven evidence.
- `duckbill-state` is a self-contained operational adapter. Its state CLI is ordinary code that accepts only explicit
  paths, IDs, modes, outcomes, and complete evidence records; the adapter makes no semantic decision and returns
  nothing to another skill.

A new AI session recovers by reading the specification, plan, and compact state summary rather than reconstructing
progress from chat history.

## Refinement Syntax

```text
/duck-refine-spec <spec-file>[#L<line>[-<end>]] <feedback>
/duck-refine-plan <plan-file>[#L<line>[-<end>]] <step|whole> <feedback>
/duck-refine-code <plan-file>[#L<line>[-<end>]] <step> <feedback>
```

A line reference adds context; it does not grant edit permission.

## Generated Artifacts

```text
specs/
├── <name>.md
└── plans/<name>/
    ├── plan.md
    └── state.json
```

Plans with embedded execution fields are unsupported. State format version 1 fails closed on corrupt or
unknown-version files.

## Development

```bash
node --test test/init-spec.test.mjs
node --test test/package-install.test.mjs
node --test test/skill-isolation.test.mjs
node --test test/state-inspection.test.mjs
node --test test/workflow-contract.test.mjs
node --check skills/duckbill-state/scripts/state.mjs
node --check skills/duckbill-spec-author/scripts/init-spec.mjs
```

## License

[MIT](LICENSE)
