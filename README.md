# Spec Duckbill

Spec Duckbill is a compact, strict Spec-Driven Development workflow for [Pi](https://github.com/badlogic/pi-mono). It turns product intent into technical intent, bounded tasks, implementation, and current proof:

```text
constitution
    ↓
specification
    ↓
technical plan
    ↓
executable tasks
    ↓
implementation
```

The format in this version is intentionally incompatible with earlier Spec Duckbill formats.

## Requirements

- Pi
- Node.js 20 or newer
- Git

## Installation

```bash
pi install https://github.com/ensiouel/spec-duckbill
```

For the current project only:

```bash
pi install -l https://github.com/ensiouel/spec-duckbill
```

Pi registers the package's prompts and four skills. The commands then locate the shared `scripts/` and `templates/` directories from the absolute `duckbill-artifacts/SKILL.md` location supplied by Pi, verify that the owning `package.json` is `spec-duckbill`, and use only files inside that package root. They never substitute same-named files from the user's project. A missing or ambiguous package runtime blocks the command before any write.

The root placement is intentional: scripts are deterministic runtime shared by all commands, while templates are shared starting structures. Skill-local normative rules remain under each skill's `references/` directory.

## Source of truth

Authority always flows downward:

1. `.duckbill/constitution.md`
2. `.duckbill/specs/<feature>/spec.md`
3. `.duckbill/specs/<feature>/plan.md`
4. `.duckbill/specs/<feature>/tasks.md`
5. application code

A lower level may add detail where a higher level leaves freedom. It cannot weaken, broaden, or contradict higher intent.

`state.json` is not part of this intent hierarchy. It stores execution state, the current operation, clarification context, attempts, evidence, hashes, staleness, and revision only.

## Project layout

All Duckbill data lives under `.duckbill/`:

```text
project/
├── .duckbill/
│   ├── constitution.md
│   └── specs/
│       └── password-authentication/
│           ├── spec.md
│           ├── plan.md
│           ├── tasks.md
│           └── state.json
├── src/
├── test/
└── package.json
```

The constitution contains project-wide non-negotiable rules. `/duck-init` creates it when absent. Edit it as a normal project file.

Each feature uses one safe lowercase kebab-case ID. Frontmatter links always use canonical repository-relative `.duckbill/specs/<feature>/...` paths.

## Artifact responsibilities

`spec.md` defines WHAT and WHY. It contains actors, user scenarios, scope, observable requirements, external contracts, data behavior, security/privacy intent, acceptance criteria, and product outcomes. It does not contain internal paths, symbols, libraries, architecture, or implementation actions.

`plan.md` defines HOW. It contains architecture, components, boundaries, internal data design, integrations, security design, operations, tests, rollout, risks, and explicit requirement mappings. It does not contain execution status or evidence.

`tasks.md` defines executable implementation outcomes. Each task has a stable ID, scenario and requirement mappings, dependencies, context, actions, and independent `CHK` checks. Feature-wide `VAL` checks have explicit mappings. Tasks do not contain status, attempts, or evidence.

`state.json` records what happened. Scripts own its schema and writes. Old state shapes are invalid.

## Commands

Duckbill exposes exactly nine commands:

| Command | Purpose |
|---|---|
| `/duck-init <feature> [description]` | Create the safe feature directory, constitution if needed, and state |
| `/duck-spec <feature> [description]` | Create a ready specification |
| `/duck-plan <feature>` | Create plan.md and tasks.md together |
| `/duck-analyze <feature> --scope spec\|all` | Read-only hierarchy and consistency analysis |
| `/duck-sync <feature>` | Synchronize plan and tasks after specification changes |
| `/duck-execute <feature> <task-id>` | Execute and validate exactly one task |
| `/duck-refine <feature> --scope ...` | Refine specification, plan/task design, or code |
| `/duck-validate <feature>` | Validate the complete feature from current evidence |
| `/duck-status <feature>` | Show deterministic state, staleness, drift, and next command |

Every command returns one structured result rendered as:

```text
Changed: <none or sorted repository-relative paths>
Status: <status>; <reason>
Next: <exact command or none>
```

`Next` is advice only. Duckbill never runs it automatically.

## Normal flow

```text
/duck-init password-authentication
    ↓
/duck-spec password-authentication "Allow registered people to sign in"
    ↓
/duck-analyze password-authentication --scope spec
    ↓
/duck-plan password-authentication
    ↓
/duck-analyze password-authentication --scope all
    ↓
/duck-execute password-authentication <task-id>
    ↓
/duck-validate password-authentication
```

Run `/duck-execute` once per task. The command checks dependencies and performs only the selected task. It never starts the next task.

## Analyze and validate

Analysis checks agreement and readiness. It is read-only.

`--scope spec` asks whether the specification is clear, complete, and consistent enough for planning. It looks for missing actors/scenarios/acceptance, ambiguity, conflicts, placeholders, misplaced implementation details, constitution violations, and invalid IDs or references.

`--scope all` asks whether constitution, specification, plan, tasks, and state metadata agree. It also checks coverage, mappings, dependencies, stale hashes, current operations, NFR coverage, and validation coverage. `CRITICAL` or `HIGH` findings block execution.

Validation asks a different question: does current evidence prove that the current implementation satisfies approved requirements? It runs checks, interprets their results, and matches evidence to `CHK` and `VAL` IDs. It never changes code or intent.

## Specification changes and sync

```text
/duck-refine password-authentication --scope spec "Require locked accounts to be denied"
    ↓
/duck-sync password-authentication
    ↓
/duck-analyze password-authentication --scope all
    ↓
/duck-execute password-authentication <affected-task-id>
    ↓
/duck-validate password-authentication
```

Specification refinement changes only spec.md and state metadata. Existing plan/tasks become stale immediately. Execution, code repair, and feature validation stay blocked until sync.

Sync compares current specification with plan/tasks, then updates both downstream artifacts. It adds work for new requirements and correction/removal work for changed or removed behavior. It does not change specification or code and does not execute tasks.

The runtime computes affected work from changed task definitions, actions, checks, mappings, dependencies, retired tasks, changed mapped requirements/plan constraints, and the current affected operation. It then adds all transitive dependents. Semantic suggestions can only expand this set.

Affected task evidence is invalidated while attempt history is kept. Unaffected task status, attempts, and evidence are preserved.

## Plan and task design changes

```text
/duck-refine password-authentication --scope plan "Split credential lookup from verification"
    ↓
automatic task and state reconciliation
    ↓
/duck-analyze password-authentication --scope all
```

Plan scope includes both technical plan and task decomposition. A change may update plan.md, tasks.md, or both. Duckbill checks the proposed design against specification before accepting it. A contradictory proposal is rejected without recording a plan/tasks change.

## Implementation repair

```text
/duck-refine password-authentication --scope code \
  --task verify-password \
  "Preserve the generic denial result"
    ↓
focused task validation
    ↓
/duck-validate password-authentication
```

Code scope repairs one task under unchanged specification and plan. If feedback changes product intent, Duckbill routes to specification refinement. If it changes the technical approach, Duckbill routes to plan refinement. Code never rewrites higher artifacts to describe what happened.

## Conflict routing

Use the level that owns the intended change:

| Situation | Action |
|---|---|
| Code is wrong | `/duck-refine <feature> --scope code --task <task-id> "<feedback>"` |
| Technical approach changed | `/duck-refine <feature> --scope plan "<feedback>"` |
| Product intent changed | `/duck-refine <feature> --scope spec "<feedback>"`, then `/duck-sync <feature>` |
| Drift has no suitable correction task | `/duck-refine <feature> --scope plan "Add a correction task for the detected implementation drift"` |

Code that contradicts specification cannot complete a task or receive passed evidence. Code that materially contradicts plan is also blocked even when it might satisfy specification. Neither specification nor plan is rewritten automatically.

## Clarification resume

Any semantic skill may return a small set of material questions owned by `specification` or `plan`. The runtime stores:

- source command and skill mode;
- command arguments;
- question IDs and ownership;
- answers already received.

The next invocation resumes the same operation from state. It does not depend on conversation memory and does not repeat answered questions. Product decisions belong to specification. Internal architecture decisions belong to plan.

## State and concurrency

State uses schema `duckbill/state@1` and an integer `revision`. Every write requires the revision read by the caller. The script rejects stale writers, increments revision exactly once, and publishes writes atomically.

Task statuses are:

```text
pending
running
partial
failed
blocked
completed
stale
```

An open execute or repair operation records its task, command, original feedback/references, starting artifact hashes, commit, and dirty-tree hash. This allows safe recovery after interruption.

## Evidence and staleness

Passed evidence is tied to current code and intent. A record includes the command and exit code, output digest, commit, dirty-tree hash, observed paths and their hashes, plus spec/plan/tasks hashes.

Evidence becomes stale when an observed path, mapped requirement, relevant acceptance criterion, task action/check/mapping/dependency, or relevant plan constraint changes. It also becomes stale when its task is affected by reconciliation.

An unrelated dirty path does not invalidate focused task evidence by itself. It still appears as repository drift and can matter to feature-wide validation.

Feature validation becomes stale when a required task/evidence becomes stale, an artifact changes, or a relevant repository snapshot no longer matches. Stale evidence remains historical information and never counts as passed.

## Write boundaries

Every changing command captures a repository snapshot before semantic work. The runtime records pre-existing changed paths and an explicit command allowlist.

After work, it compares path content before and after, separates command-created changes from pre-existing changes, and rejects success when an unauthorized path changed. It reports those paths and never resets or cleans the working tree. State is not marked completed after a boundary failure.

This protects application code from artifact commands and protects intent artifacts from implementation commands.

## Repository drift and recovery

Duckbill detects drift from Git commit, dirty-tree hash, observed path hashes, artifact hashes, stale evidence, and validation failures. It does not reconstruct new intent from arbitrary code changes.

Recovery flow:

```text
/duck-status password-authentication
    ↓
/duck-analyze password-authentication --scope all
    ↓
/duck-validate password-authentication
    ↓
explicit /duck-refine with scope spec, plan, or code
```

For an interrupted operation, `/duck-status` reports its exact type and task. Resume execute with the same task. Resume repair through code refinement; the original feedback is already stored in state.

For stale artifacts, synchronize or explicitly refine the owning level. For stale evidence, rerun the governed task or repair. For a failed check, do not change intent unless the intended behavior itself has explicitly changed.

## Deterministic runtime

The bundled Node.js scripts enforce critical structure and safety:

- `scripts/check.mjs` parses artifacts and validates schemas, IDs, links, mappings, coverage, tasks, and dependency graphs;
- `scripts/state.mjs` owns state validation, revisions, operations, clarification, reconciliation, attempts, evidence, and status;
- `scripts/repository.mjs` owns Git snapshots, safe paths, symlink protection, observed hashes, drift, and write boundaries;
- `scripts/utils.mjs` owns hashing, frontmatter primitives, atomic writes, structured results, and the single terminal renderer.

Run the repository checks with:

```bash
npm test
```

## License

[MIT](LICENSE)
