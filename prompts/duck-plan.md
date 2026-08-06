---
description: Create a technical plan and executable tasks from a ready specification
argument-hint: "<feature>"
---

Plan feature `$1`.

## Skills

Load `duckbill-runtime` and `duckbill-plan`. Use mode `create-plan`. If either is unavailable, make no writes and return `blocked`.

## Permissions

May create only canonical plan.md, tasks.md, and update state.json. Constitution, specification, application code, tests, and configuration are read-only.

## Flow

1. Parse feature.
2. Invoke `duckbill-runtime` with operation `prepare` for `duck-plan`. Build the semantic input from the constitution, specification, bundled plan/task templates, project instructions, and relevant verified repository facts.
3. If runtime reports a matching pending clarification, collect the user's ordinary reply and invoke `duckbill-runtime` with operation `resume` before calling the semantic skill.
4. Invoke `duckbill-plan` in mode `create-plan` with the prepared input and declared permissions.
5. On a typed clarification result, invoke `duckbill-runtime` with operation `clarify`, show the returned questions, and wait for the reply.
6. On a plan/tasks result, invoke `duckbill-runtime` with operation `finalize` for `duck-plan`.
7. Invoke `duckbill-runtime` with operation `render` for the structured command result. Never execute Next or a task.
