---
description: Refine specification, technical plan/task design, or one task's implementation
argument-hint: "<feature> --scope spec|plan|code [--task <task-id>] <feedback>"
---

Refine feature `$1` with command arguments `${@:2}`.

## Skills

Load `duckbill-runtime`. For scope `spec`, load `duckbill-specification` in mode `refine-spec`; for `plan`, load `duckbill-plan` in mode `refine-plan`; for `code`, load `duckbill-execution` in mode `repair` and `duckbill-validation` in mode `validate-task`. If a required skill is unavailable, make no writes and return `blocked`.

## Permissions

- `spec`: only spec.md and state.json.
- `plan`: only plan.md, tasks.md, and state.json.
- `code`: task-scoped application code/tests/configuration and state.json.

Constitution is always read-only. A scope never receives another scope's write permission.

## Flow

1. Parse exactly one scope and non-empty feedback. Require a task ID only for code scope.
2. Invoke `duckbill-runtime` with operation `prepare` for `duck-refine` and that scope. If it reports matching clarification, collect the user's ordinary reply and invoke `duckbill-runtime` with operation `resume` before continuing.
3. For spec scope, invoke `duckbill-specification` in mode `refine-spec` with constitution, specification, feedback, and runtime findings, then invoke `duckbill-runtime` with operation `finalize` for the result.
4. For plan scope, invoke `duckbill-plan` in mode `refine-plan` with constitution, specification, plan, tasks, feedback, and runtime context, then invoke `duckbill-runtime` with operation `finalize` for the result.
5. For code scope, invoke `duckbill-execution` in mode `repair` and phase `preflight` with the task, governing artifacts, persisted feedback, project context, and runtime preflight data, then invoke runtime operation `verify` for that read-only stage. On an implementation-owned result, invoke `duckbill-runtime` with operation `begin`, invoke the same skill and mode in phase `apply`, invoke runtime operation `verify` for the apply stage, invoke `duckbill-validation` in mode `validate-task`, invoke runtime operation `verify` for validation, then invoke `duckbill-runtime` with operation `finalize` for the repair.
6. For any typed clarification result, invoke `duckbill-runtime` with operation `clarify`, show the returned questions, and wait. Pass typed ownership conflicts to `duckbill-runtime` operation `finalize` without running a lower-level stage.
7. Invoke `duckbill-runtime` with operation `render` for the structured command result. Never execute Next.
