---
description: Execute and validate exactly one current Duckbill task
argument-hint: "<feature> <task-id>"
---

Execute task `$2` for feature `$1`.

## Skills

Load `duckbill-runtime`, `duckbill-consistency`, `duckbill-execution`, and `duckbill-validation`. Use modes `analyze-all`, `execute`, and `validate-task`. If a required skill is unavailable, make no writes and return `blocked`.

## Permissions

May write task-scoped application code, tests, configuration, and canonical state.json. Constitution, spec.md, plan.md, and tasks.md are read-only.

## Flow

1. Parse feature and task ID.
2. Invoke `duckbill-runtime` with operation `prepare` for `duck-execute`.
3. If runtime reports matching clarification, collect the user's ordinary reply and invoke `duckbill-runtime` with operation `resume` before continuing.
4. Invoke `duckbill-consistency` in mode `analyze-all` with the constitution, artifacts, state metadata, and runtime findings. Pass a blocking typed result to `duckbill-runtime` operation `finalize` and skip execution.
5. Invoke `duckbill-runtime` with operation `verify` for the read-only consistency stage.
6. Invoke `duckbill-execution` in mode `execute` and phase `preflight` with the selected task, governing artifacts, project context, runtime preflight data, and read-only permissions, then invoke runtime operation `verify` for that read-only stage.
7. On a typed clarification result, invoke `duckbill-runtime` with operation `clarify`, show the returned questions, and wait. On a higher-level conflict, invoke `duckbill-runtime` with operation `finalize` for its typed routing result without beginning work.
8. Invoke `duckbill-runtime` with operation `begin` for the task, then invoke the same execution mode in phase `apply` with runtime-provided task write permissions. Invoke runtime operation `verify` for the apply stage before validation.
9. Invoke `duckbill-validation` in mode `validate-task` with the governing artifacts, selected task, implementation result, state metadata, and current runtime context, then invoke runtime operation `verify` for the read-only validation stage.
10. Invoke `duckbill-runtime` with operation `finalize` for `duck-execute` and pass both typed results.
11. Invoke `duckbill-runtime` with operation `render` for the structured command result. Never execute Next or another task.
