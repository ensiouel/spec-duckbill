# Spec Duckbill

Spec Duckbill is a spec-driven development workflow for [Pi](https://github.com/badlogic/pi-mono). It helps turn an
idea into a specification, an implementation plan, and tested code:

```text
specification -> plan -> implementation -> validation
```

Duckbill performs one step at a time and suggests the next command. It never starts the next step automatically.

## Requirements

- Pi
- Node.js 20 or newer
- Git

## Installation

```bash
pi install https://github.com/ensiouel/spec-duckbill
```

To install Duckbill only for the current project:

```bash
pi install -l https://github.com/ensiouel/spec-duckbill
```

## Quick Start

Create a specification draft:

```text
/duck-init Password Authentication
```

Open `specs/password-authentication.md`, replace the `[WRITE HERE]` line with your requirements, and develop the
specification:

```text
/duck-spec specs/password-authentication.md
```

Create an implementation plan:

```text
/duck-plan specs/password-authentication.md
```

Run the command shown on the `Next` line. For example:

```text
/duck-execute specs/plans/password-authentication/plan.md hash-password
```

Each `/duck-execute` invocation completes one plan step. Continue with the suggested `Next` command until validation
is complete.

## Commands

| Command | Purpose |
|---|---|
| `/duck-init <name>` | Create an editable specification draft |
| `/duck-spec <spec-file>` | Turn the draft into a complete specification |
| `/duck-plan <spec-file>` | Create an implementation plan |
| `/duck-execute <plan-file> <step-id>` | Implement one plan step |
| `/duck-refine-spec <spec-file> <feedback>` | Change the product requirements |
| `/duck-refine-plan <plan-file> <step\|whole> <feedback>` | Change the implementation plan |
| `/duck-refine-code <plan-file> <step-id> <feedback>` | Correct the implementation of a completed step |

You can add a line range to a specification or plan path when giving feedback, for example:

```text
/duck-refine-spec specs/password-authentication.md#L20-L28 Require one-time recovery links
```

## Command Results

Every command reports what changed, what happened, and what you can run next:

```text
Changed: <changed files or none>
Status: <result and reason>
Next: <next Duckbill command or none>
```

## Project Files

```text
specs/
├── <name>.md
└── plans/<name>/
    ├── plan.md
    └── state.json
```

Keep `state.json` in Git. Duckbill uses it to resume the workflow across sessions.

## License

[MIT](LICENSE)
