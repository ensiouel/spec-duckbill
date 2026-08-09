# Spec Duckbill

Spec-driven development for [Pi](https://pi.dev): specification -> plan -> tasks -> code -> validation.

## Install

Requires Pi 0.83+ and ChatGPT Plus or Pro.

```text
/login openai-codex
```

```bash
pi install npm:pi-prompt-template-model
pi install https://github.com/ensiouel/spec-duckbill
```

Add the prompt directory to `~/.pi/agent/settings.json`, then restart Pi:

```json
{
  "prompts": [
    "git/github.com/ensiouel/spec-duckbill/prompts"
  ]
}
```

For a project-local installation, use `pi install -l` and `.pi/settings.json`.

## Commands

Use lowercase kebab-case feature names.

| Command                                                                  | Purpose                             |
|--------------------------------------------------------------------------|-------------------------------------|
| `/duckbill-init <feature> [context...]`                                  | Create a draft specification        |
| `/duckbill-spec <feature> [context...]`                                  | Develop the specification           |
| `/duckbill-analyze <feature>`                                            | Review the specification read-only  |
| `/duckbill-plan <feature> [context...]`                                  | Create the technical plan and tasks |
| `/duckbill-refine-spec <feature> <product-feedback...>`                  | Refine product requirements         |
| `/duckbill-refine-plan <feature> <technical-feedback...>`                | Refine technical design and tasks   |
| `/duckbill-refine-code <feature> <task-id> <implementation-feedback...>` | Refine one task's implementation    |
| `/duckbill-execute <feature> <task-id> [context...]`                     | Implement one pending task          |
| `/duckbill-validate <feature>`                                           | Validate the feature read-only      |

Typical flow:

```text
/duckbill-init password-authentication "Add password sign-in"
/duckbill-spec password-authentication
/duckbill-plan password-authentication
/duckbill-execute password-authentication T1
/duckbill-validate password-authentication
```

## Refinement

Refinement is split because specification, planning, and implementation are separate ownership layers. Each command
therefore has one capability, one input shape, and one mutation boundary.

| Command                | Skill                    | Profile                | May change                                                | Escalation                                                                        |
|------------------------|--------------------------|------------------------|-----------------------------------------------------------|-----------------------------------------------------------------------------------|
| `duckbill-refine-spec` | `duckbill-specification` | GPT-5.6 Sol / high     | `spec.md`                                                 | Stop on unresolved product decisions; suggest planning reconciliation when needed |
| `duckbill-refine-plan` | `duckbill-planning`      | GPT-5.6 Sol / high     | `plan.md`, `tasks.md`                                     | WHAT/WHY changes -> specification                                                 |
| `duckbill-refine-code` | `duckbill-execution`     | GPT-5.6 Terra / medium | Code, tests, justified configuration, selected task state | Technical design -> planning; WHAT/WHY -> specification                           |

Each command statically preloads one skill, uses `restore: true`, has no model fallback or boomerang, and never invokes
a handoff automatically. Completed tasks remain eligible for code refinement; task state stays `pending` or
`completed`.

```text
/duckbill-refine-spec checkout "Payment completion is now asynchronous"
/duckbill-refine-plan checkout "Reconcile the design and tasks"
/duckbill-refine-code checkout T2 "Handle the timeout branch"
```

Advisory sequence: `refine-spec -> refine-plan -> refine-code / execute -> validate`. Start at the layer that owns the
change.

## Architecture and artifacts

`Commands = workflow`, `Skills = capabilities`, `Artifacts = persistent state`.

Authority flows `specification -> plan -> tasks -> code`. Duckbill keeps four skills: `duckbill-specification`,
`duckbill-planning`, `duckbill-execution`, and `duckbill-validation`.

```text
.duckbill/
|-- constitution.md
`-- specs/<feature>/
    |-- spec.md
    |-- plan.md
    `-- tasks.md
```

## License

[MIT](LICENSE)
