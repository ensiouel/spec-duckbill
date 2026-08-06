---
description: Synchronize technical plan and tasks with the current ready specification
argument-hint: "<feature>"
---

Synchronize downstream artifacts for `$1`.

## Skills

Load `duckbill-runtime`, `duckbill-consistency`, and `duckbill-plan`. Use modes `prepare-sync` and `sync-plan`. If a required skill is unavailable, make no writes and return `blocked`.

## Permissions

May write only canonical plan.md, tasks.md, and state.json. Specification, constitution, application code, tests, and configuration are read-only.

## Flow

1. Parse feature.
2. Invoke `duckbill-runtime` with operation `prepare` for `duck-sync`.
3. If runtime reports matching clarification, collect the user's ordinary reply and invoke `duckbill-runtime` with operation `resume` before continuing the saved mode.
4. Invoke `duckbill-consistency` in mode `prepare-sync` with the constitution, current artifacts, state metadata, runtime findings, and relevant implementation facts. Invoke `duckbill-runtime` with operation `verify` for this read-only stage, then pass the typed result with the same authoritative artifacts to `duckbill-plan` in mode `sync-plan`.
5. On a typed clarification result from either semantic stage, invoke `duckbill-runtime` with operation `clarify`, show the returned questions, and wait for the reply.
6. On a plan/tasks result, invoke `duckbill-runtime` with operation `finalize` for `duck-sync` and pass both semantic results.
7. Invoke `duckbill-runtime` with operation `render` for the structured command result. Never execute Next or affected tasks.
