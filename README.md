# Spec Duckbill

Spec Duckbill is a file-first Spec-Driven Development extension for [Pi](https://github.com/earendil-works/pi).

```text
constitution
    ↓
specification
    ↓
technical plan
    ↓
tasks
    ↓
implementation
```

The extension keeps this flow explicit without implementing its own agent runtime. Pi runs the agent and normal tools.
Git shows the changes. Duckbill selects the current feature, loads only the relevant guidance, and suggests the next
action.

## Installation

Requirements: Pi, Git, and Node.js 20 or newer.

```bash
pi install https://github.com/ensiouel/spec-duckbill
```

For the current project only:

```bash
pi install -l https://github.com/ensiouel/spec-duckbill
```

## Commands

All actions use one namespace:

| Command                                            | Purpose                                                |
|----------------------------------------------------|--------------------------------------------------------|
| `/duck`                                            | Show help                                              |
| `/duck:init <feature> [description]`               | Create an ordinary feature workspace                   |
| `/duck:spec <feature> [description]`               | Create or improve the specification                    |
| `/duck:analyze <feature> <spec\|all>`              | Analyze specification or whole-feature consistency     |
| `/duck:plan <feature> [description]`               | Create the technical plan and tasks                    |
| `/duck:sync <feature> [description]`               | Synchronize plan and tasks after specification changes |
| `/duck:execute <feature> <task-id> [description]`  | Execute one dependency-ready task                      |
| `/duck:refine <feature> spec <feedback>`           | Refine the specification                               |
| `/duck:refine <feature> plan <feedback>`           | Refine the plan and tasks                              |
| `/duck:refine <feature> code <task-id> <feedback>` | Repair one task implementation                         |
| `/duck:validate <feature> [description]`           | Validate the complete feature without repairing it     |
| `/duck:status <feature>`                           | Show status inferred from project files                |

The feature is always explicit. Duckbill does not infer it from branches, directories, or previous commands. Commands
have one positional syntax: no alternative scope flags and no silently ignored arguments.

## Normal flow

```text
/duck:init password-authentication
    ↓
/duck:spec password-authentication
    ↓
/duck:analyze password-authentication spec
    ↓
/duck:plan password-authentication
    ↓
/duck:analyze password-authentication all
    ↓
/duck:execute password-authentication verify-password
    ↓
/duck:validate password-authentication
```

`Next` is only a suggestion. Duckbill never starts another action automatically.

## Project files

```text
.duckbill/
├── constitution.md
└── specs/
    └── password-authentication/
        ├── spec.md
        ├── plan.md
        └── tasks.md
```

There is no `state.json`. Progress is visible in `tasks.md`:

```markdown
### Task 1: Verify password

**ID:** verify-password

**Status:** pending
```

Execution changes the selected task to `completed` only after its checks pass.

Status is inferred from existing files:

```text
draft specification       -> /duck:spec
ready spec without plan   -> /duck:plan
spec newer than plan      -> /duck:sync
pending task              -> /duck:execute
all tasks completed       -> /duck:validate
```

Duckbill does not select a task. Status lists all dependency-ready task IDs and prints the explicit placeholder:

```text
Ready tasks: verify-password, create-session
Next: /duck:execute password-authentication <task-id>
```

Artifact metadata is required. Missing or unknown specification, plan, task status, task ID, or dependencies are
reported as issues rather than guessed. When a plan is stale, status shows the exact timestamp rule:

```text
Plan: stale
Plan reason: spec.md was modified after plan.md
```

## Prompts and skills

The package keeps semantic materials private instead of registering them globally in Pi:

```text
assets/
├── prompts/
├── skills/
└── templates/
```

Each action loads only its own prompt, relevant skill references, and required templates. For example, specification
work does not load execution guidance.

These files explain the work. They do not contain scripts, permissions, state transitions, or hidden workflow logic.

## Source structure

```text
src/
├── index.mjs
├── workspace.mjs
├── prompts.mjs
├── status.mjs
└── git.mjs
```

- `index.mjs` registers `/duck:*` and starts normal Pi turns.
- `workspace.mjs` manages feature paths, selection, and initialization.
- `prompts.mjs` selects and loads private semantic materials.
- `status.mjs` derives progress from ordinary files.
- `git.mjs` reads the repository root and worktree status.

Duckbill does not register custom tools, replace Pi sessions, maintain an evidence ledger, lock write paths, or
implement its own state machine. Preserve unrelated changes and review the resulting Git diff as with normal agent work.

## License

[MIT](LICENSE)
