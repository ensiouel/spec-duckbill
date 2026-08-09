# Spec Duckbill

Spec Duckbill is a Spec-Driven Development workflow for [Pi](https://pi.dev). It turns a feature idea into a
specification, an implementation plan, executable tasks, and a final validation.

## Install

Requirements:

- Pi 0.83 or newer;
- a ChatGPT Plus or Pro subscription for the configured OpenAI Codex models.

```text
/login openai-codex
```

```bash
pi install npm:pi-prompt-template-model
pi install https://github.com/ensiouel/spec-duckbill
```

Add Duckbill's prompt directory to `~/.pi/agent/settings.json`, preserving any existing `prompts` entries:

```json
{
  "prompts": [
    "git/github.com/ensiouel/spec-duckbill/prompts"
  ]
}
```

Restart Pi after installation.

For a project-local installation, use `pi install -l` for both packages and put the setting in `.pi/settings.json`
instead.

## Quick start

Use a lowercase kebab-case feature name:

```text
/duckbill-init password-authentication "Add password sign-in"
/duckbill-spec password-authentication
/duckbill-plan password-authentication
/duckbill-execute password-authentication T1
/duckbill-validate password-authentication
```

Read `tasks.md` after planning and execute each dependency-ready task by its ID. Run
`/duckbill-analyze password-authentication` before planning when you want an optional specification review.

The usual flow is:

```text
init → spec → plan → execute tasks → validate
```

## Commands

| Command                                                   | Purpose                                           |
|-----------------------------------------------------------|---------------------------------------------------|
| `/duckbill-init <feature> [context...]`                   | Start a feature and create a draft specification  |
| `/duckbill-spec <feature> [context...]`                   | Develop the specification                         |
| `/duckbill-analyze <feature>`                             | Review the specification without changing files   |
| `/duckbill-plan <feature> [context...]`                   | Create the technical plan and tasks               |
| `/duckbill-execute <feature> <task-id> [context...]`      | Implement one pending task                        |
| `/duckbill-refine <feature> spec <feedback...>`           | Update product behavior or requirements           |
| `/duckbill-refine <feature> plan <feedback...>`           | Update the technical plan and tasks               |
| `/duckbill-refine <feature> code <task-id> <feedback...>` | Adjust an implementation                          |
| `/duckbill-validate <feature>`                            | Check the finished feature without changing files |

Duckbill always asks you to name the feature and, for implementation work, the task. It may stop to ask for a missing
decision or suggest a next command, but it never starts the next operation automatically.

## Refining a feature

Use `refine` when something already written needs to change:

```text
/duckbill-refine checkout spec "Payment completion is now asynchronous"
/duckbill-refine checkout plan "Update the design and tasks for asynchronous payment"
/duckbill-refine checkout code T2 "Handle the existing timeout branch"
```

Choose the scope by what changed:

- `spec` for behavior, scope, constraints, or acceptance criteria;
- `plan` for technical design or task breakdown;
- `code` for implementation changes that still fit the current specification and plan.

After changing a specification, refine the plan before continuing implementation.

## Project files

Duckbill stores its work as Markdown in the project:

```text
.duckbill/
├── constitution.md                 optional project-wide guidance
└── specs/
    └── <feature>/
        ├── spec.md                 requirements and acceptance criteria
        ├── plan.md                 technical approach
        └── tasks.md                task IDs, dependencies, and progress
```

These files are the workflow state and can be reviewed and committed with the rest of the project.

## License

[MIT](LICENSE)
