# Spec Duckbill

Spec Duckbill is a Pi package for a manually advanced waterfall:

```text
spec -> plan -> code
```

One command changes one level, verifies its result, recommends one `Next` action, and stops. The user runs every
transition manually; Duckbill never invokes the next command.

## Installation

```bash
pi install https://github.com/ensiouel/spec-duckbill
```

For local development: `pi install .`

Requirements: Pi, Node.js 20+, and Git. Add generated patches to the target project's `.gitignore`:

```gitignore
specs/plans/*/steps/*.patch
```

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

Recommendations appear only in `Next`. A command in `Next` is never run automatically.

## Ownership

| Level | Owns | Commands |
|---|---|---|
| specification intent | scope, behavior/constraints, contracts, data, security, acceptance, high-level design | `/duck-spec`, `/duck-refine-spec` |
| plan intent | implementation approach/scope, prerequisites, steps, Actions, Success Criteria, dependencies, mappings, validation, risks | `/duck-plan`, `/duck-refine-plan` |
| execution state | checkmarks, step Status/Attempt/Files Changed, Base Tree, Current Step, Patch state | `/duck-execute`; refiners only as allowed |
| implementation code | project code, tests, and step implementation files | `/duck-execute`, `/duck-refine-code` |

Execution state is stored in the plan but is not plan intent. New plans omit execution records; `/duck-execute` creates
them lazily.

The frontmatter links are reciprocal workflow metadata: the specification owns `plan-file`; the plan owns `spec-file`.
`/duck-spec` and `/duck-plan` may restore only their own link. Refinement commands preserve links and route invalid
metadata to its owner.

## Routing

| Situation | Next |
|---|---|
| specification changed | manual `/duck-refine-plan`, or `/duck-plan` when absent |
| plan intent changed | first affected `/duck-execute` |
| new/unexecuted, `partial`, `failed`, or `stale` step | `/duck-execute` |
| code defect in a `completed` step with correct documents | `/duck-refine-code` |
| specification-level feedback in a lower command | `/duck-refine-spec` |
| plan-level feedback in a code command | `/duck-refine-plan` |
| material unknown or external action | clarify/act first; `Next: none` |

`/duck-refine-spec` changes only specification intent. It reports changed requirement IDs but does not synchronize the
plan or mark steps stale.

`/duck-refine-plan` changes plan intent and only the execution state needed to keep evidence truthful. During manual
synchronization it preserves stable IDs for unchanged outcomes, marks affected executed steps `stale`, and resets
invalidated evidence. It never edits specification or code.

`/duck-execute` implements exactly the first executable step and stops. `/duck-refine-code` repairs only a `completed`
step whose specification and plan intent already describe the correct behavior. Neither command may change intent.

All mutable commands classify ownership, permissions, and material unknowns before writing. A `blocked` result changes
no files or execution state.

Command-result Status prefixes are `draft | ready | completed | partial | failed | blocked | unchanged`. Persisted step
Status is `completed | partial | failed | stale`; only `/duck-refine-plan` writes `stale`.

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
├── <name>.md                         # plan-file: specs/plans/<name>/plan.md
└── plans/<name>/
    ├── plan.md                       # spec-file: specs/<name>.md
    └── steps/<step-id>.patch
```

Specifications use stable `FR-`, `NFR-`, and `AC-` IDs. Plans map them to stable step IDs, execute in order, and keep
one isolated patch per step.

Patches compare an attempt with its captured working-tree baseline; they are not cumulative. Re-entering a non-current
step captures a fresh baseline and replaces only that step's patch. The builder uses a temporary Git index and creates
no commit, branch, stash, or worktree. It excludes the governing specification, plan, and generated patches—not the
whole `specs/` tree. Patches are review artifacts, not backups.

## Development

```bash
node --test
node --check skills/duckbill-spec-author/scripts/init-spec.mjs
node --check skills/duckbill-step-patch/scripts/step-patch.mjs
```

## License

[MIT](LICENSE)
