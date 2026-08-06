---
description: Develop an editable draft into a ready WHAT-and-WHY specification
argument-hint: "<feature> [description]"
---

Develop the existing draft specification for `$1`. Treat `${@:2}` only as optional extra context.

## Skills

Load `duckbill-runtime` and `duckbill-specification`. Use mode `create-spec`. If either is unavailable, make no writes and return `blocked`.

## Permissions

May write only canonical spec.md and state.json. Constitution, plan, tasks, application code, tests, and configuration are read-only.

## Flow

1. Parse feature and optional description.
2. Invoke `duckbill-runtime` with operation `prepare` for `duck-spec`. Build the semantic input from the user's Feature Brief, constitution, optional description, project instructions, verified observable facts, and runtime findings.
3. If runtime reports a matching pending clarification, collect the user's ordinary reply and invoke `duckbill-runtime` with operation `resume` before calling the semantic skill.
4. Invoke `duckbill-specification` in mode `create-spec` with the prepared input and declared permissions.
5. On a typed clarification result, invoke `duckbill-runtime` with operation `clarify`, show the returned questions, and wait for the reply.
6. On an artifact result, invoke `duckbill-runtime` with operation `finalize` for `duck-spec` and pass that result.
7. Invoke `duckbill-runtime` with operation `render` for the structured command result. Never execute Next.
