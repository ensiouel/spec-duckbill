---
description: Synchronize technical plan and tasks with the current ready specification
argument-hint: "<feature>"
---

Synchronize downstream artifacts for `$1`.

## Package bootstrap

Before preflight or any write, find the exact `duckbill-artifacts` `<location>` in Pi's `<available_skills>`. Resolve `<package-root>` as `../..` from the directory containing that `SKILL.md`, canonicalize it, and require `<package-root>/package.json` to have `name: "spec-duckbill"`, `pi.prompts: ["./prompts"]`, and `pi.skills: ["./skills"]`. Resolve runtime only from `<package-root>/scripts/`; canonicalize each used file and require it to remain inside that package root. Invoke runtime scripts only through `node <package-root>/scripts/<script>.mjs ...`, never as bare executables. Never fall back to similarly named project files or guessed npm/Git install directories. If bootstrap is missing, ambiguous, or invalid, make no writes and return `blocked` with the bootstrap error.

## Permissions

May write only canonical plan.md, tasks.md, and state.json. Specification, constitution, application code, tests, and configuration are read-only.

## Flow

1. Resolve canonical paths and state. Require a deterministic-valid ready specification and no unrelated current operation. Read existing plan/tasks when present.
2. Capture `<package-root>/scripts/repository.mjs snapshot` and exact spec/plan/tasks preimages in safe temporary files. Allow only plan.md, tasks.md, and state.json.
3. Invoke read-only `duckbill-consistency` mode `prepare-sync` with current artifacts, stored hashes, and relevant implementation facts for removed behavior.
4. Invoke `duckbill-artifacts` mode `sync-artifacts` with the specification and structured sync findings. It updates plan and tasks together and never code/specification.
   If either semantic result needs clarification, persist its command/mode/arguments/questions/answers through `<package-root>/scripts/state.mjs`, show only the questions, and resume from state on the next invocation.
5. Run `<package-root>/scripts/check.mjs all`, then enforce a plan.md/tasks.md-only semantic `<package-root>/scripts/repository.mjs boundary`. On either failure, do not reconcile state or claim success.
6. After the boundary passes, run `<package-root>/scripts/state.mjs reconcile` with preimages and agent-suggested affected IDs. Use the runtime affected union, transitive dependents, and preserved unaffected evidence. Run a final `<package-root>/scripts/repository.mjs boundary` for plan.md/tasks.md/state.json. Do not execute affected tasks.
7. Render a structured result with Next `duck-analyze $1 --scope all` only through `<package-root>/scripts/utils.mjs render`. Never execute Next.
