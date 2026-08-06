# Spec Duckbill

Spec Duckbill is a compact Spec-Driven Development workflow for [Pi](https://github.com/earendil-works/pi).

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

Each lower level follows the level above it. Code cannot redefine tasks, tasks cannot redefine the plan, and the plan
cannot redefine the specification.

This version uses a new format that is not compatible with earlier Spec Duckbill versions.

## Installation

Requirements: Pi, Git, and Node.js 20 or newer.

Install globally:

```bash
pi install https://github.com/ensiouel/spec-duckbill
```

Install for the current project only:

```bash
pi install -l https://github.com/ensiouel/spec-duckbill
```

No files need to be copied or linked manually. Pi loads the commands and skills from the installed package; Duckbill's
scripts and starting templates are bundled inside the skills that use them.

## Project files

Duckbill keeps all of its project files under `.duckbill/`:

```text
.duckbill/
├── constitution.md
└── specs/
    └── password-authentication/
        ├── spec.md
        ├── plan.md
        ├── tasks.md
        └── state.json
```

The files have separate responsibilities:

- `constitution.md` contains project-wide rules that every feature must follow.
- `spec.md` defines WHAT the feature does and WHY it is needed.
- `plan.md` defines HOW the feature will be implemented.
- `tasks.md` divides the plan into executable outcomes.
- `state.json` stores progress, evidence, clarification, and staleness. It is managed by Duckbill and is not a source of
  product or technical intent.

The source-of-truth order is constitution, specification, plan, tasks, then application code.

## Commands

Duckbill provides exactly nine commands:

| Command                                     | Purpose                                                                   |
|---------------------------------------------|---------------------------------------------------------------------------|
| `/duck-init <feature> [description]`        | Create the feature, editable draft specification, constitution, and state |
| `/duck-spec <feature> [description]`        | Develop the draft into a ready specification                              |
| `/duck-plan <feature>`                      | Create the technical plan and executable tasks                            |
| `/duck-analyze <feature> --scope spec\|all` | Find gaps and conflicts without changing files                            |
| `/duck-sync <feature>`                      | Update plan and tasks after the specification changes                     |
| `/duck-execute <feature> <task-id>`         | Implement and check exactly one task                                      |
| `/duck-refine <feature> --scope ...`        | Refine specification, plan/task design, or code                           |
| `/duck-validate <feature>`                  | Validate the complete feature against current evidence                    |
| `/duck-status <feature>`                    | Show progress, staleness, drift, and the next suggested command           |

`Next` is always a suggestion. Duckbill never runs the next command or task automatically.

## Normal workflow

Start a feature without writing a long description in the command:

```text
/duck-init password-authentication
    ↓
edit .duckbill/specs/password-authentication/spec.md
    ↓
/duck-spec password-authentication
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

`/duck-init` creates a minimal `spec.md` with `status: draft` and one `## Feature Brief` field. Describe the feature
there in ordinary language. The optional description argument only pre-fills that field.

`/duck-spec` uses that brief as its main input and builds the complete specification with actors, scenarios,
requirements, acceptance criteria, and stable IDs. It asks for material product decisions when needed and marks the
specification ready only after its checks pass.

Run `/duck-execute` separately for each task. One invocation performs one task and never starts another.

## Analyze, validate, and status

These commands answer different questions:

- `/duck-analyze --scope spec`: is the specification clear and complete enough to plan?
- `/duck-analyze --scope all`: do constitution, specification, plan, tasks, and state agree?
- `/duck-validate`: does current evidence prove that the implementation satisfies the approved requirements?
- `/duck-status`: what is current, stale, blocked, or interrupted, and what command should be considered next?

Analysis and status are read-only. Validation may update validation evidence in `state.json`, but it never fixes code or
changes intent.

## Changing the specification

After a specification is ready, change it through explicit refinement:

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

A specification change makes the existing plan, tasks, and related evidence stale. `/duck-sync` updates the downstream
artifacts, adds correction or removal work when necessary, and preserves unaffected task evidence. It does not execute
any task.

## Changing the plan or task design

```text
/duck-refine password-authentication --scope plan "Split credential lookup from verification"
    ↓
/duck-analyze password-authentication --scope all
```

Plan scope covers both the technical approach and task decomposition. A proposed plan or task change is rejected if it
contradicts the specification.

## Repairing implementation

```text
/duck-refine password-authentication --scope code \
  --task verify-password \
  "Preserve the generic denial result"
    ↓
/duck-validate password-authentication
```

Code refinement repairs one task without changing specification or plan. If feedback actually changes product intent,
use specification refinement. If it changes the technical approach, use plan refinement.

## Clarification and interruption

When a material decision is missing, Duckbill asks focused `Q-###` questions. Reply normally, for example
`Q-001: Use the existing authentication boundary`. No command flag or JSON input is required. Duckbill keeps the
command, answers, and source artifact hashes in state until the operation completes.

If the specification, plan, or tasks change before the operation continues, the saved questions are discarded as stale
and evaluated again. After a lost conversation, run the original command again to show the still-current unanswered
questions.

Original repair feedback is also stored, so an interrupted code repair can resume without reconstructing the request
from memory.

## Evidence, staleness, and drift

Completed work is accepted only when its evidence still matches the current requirements, plan, task definition, and
observed code. Relevant changes make that evidence stale. Unrelated task evidence is preserved.

If code changes outside Duckbill, the workflow does not guess new intent from the code. Inspect the situation first:

```text
/duck-status password-authentication
    ↓
/duck-analyze password-authentication --scope all
    ↓
/duck-validate password-authentication
    ↓
explicit /duck-refine with scope spec, plan, or code
```

Use the scope that owns the intended change:

- wrong implementation: `--scope code --task <task-id>`;
- changed technical approach or missing correction task: `--scope plan`;
- changed product behavior: `--scope spec`, followed by `/duck-sync`.

Duckbill limits every changing command to its allowed files. Unexpected writes block success, and pre-existing user
changes are never automatically reset or cleaned.

## License

[MIT](LICENSE)
