---
description: Create a technical plan and executable tasks from a ready specification
argument-hint: "<feature>"
---

Plan feature `$1`.

## Package bootstrap

Before preflight or any write, find the exact `duckbill-artifacts` `<location>` in Pi's `<available_skills>`. Resolve `<package-root>` as `../..` from the directory containing that `SKILL.md`, canonicalize it, and require `<package-root>/package.json` to have `name: "spec-duckbill"`, `pi.prompts: ["./prompts"]`, and `pi.skills: ["./skills"]`. Resolve runtime only from `<package-root>/scripts/` and templates only from `<package-root>/templates/`; canonicalize each used file and require it to remain inside that package root. Invoke runtime scripts only through `node <package-root>/scripts/<script>.mjs ...`, never as bare executables. Never fall back to similarly named project files or guessed npm/Git install directories. If bootstrap is missing, ambiguous, or invalid, make no writes and return `blocked` with the bootstrap error.

## Permissions

May create only canonical plan.md, tasks.md, and update state.json. Constitution, specification, application code, tests, and configuration are read-only.

## Flow

1. Resolve canonical paths and state. Require spec.md, `status: ready`, `<package-root>/scripts/check.mjs spec` success, no pending clarification, absent plan.md/tasks.md, and regular bundled `templates/plan.md` and `templates/tasks.md` files.
2. Capture the repository snapshot through `<package-root>/scripts/repository.mjs snapshot` and allow only plan.md, tasks.md, and state.json.
3. Load constitution, specification, `<package-root>/templates/plan.md`, `<package-root>/templates/tasks.md`, relevant project instructions/code facts, interfaces, tests, and commands. Invoke `duckbill-artifacts` mode `create-plan` with both templates as starting structures, explicit inputs, and permissions. Normative format rules still come from the skill references.
4. On clarification, persist its source command, mode, arguments, questions, and answers through `<package-root>/scripts/state.mjs`; show only questions and stop. Resume from state on the next invocation.
5. Require both artifacts, run `<package-root>/scripts/check.mjs all`, then enforce a plan.md/tasks.md-only semantic `<package-root>/scripts/repository.mjs boundary`. Unauthorized writes block success and remain visible without state reconciliation.
6. After the boundary passes, run `<package-root>/scripts/state.mjs reconcile` with no old plan/tasks, current artifact hashes, and the skill's suggested affected IDs. Run a final `<package-root>/scripts/repository.mjs boundary` for plan.md/tasks.md/state.json. This initializes task records without executing one.
7. Render a structured result with Next `duck-analyze $1 --scope all` only through `<package-root>/scripts/utils.mjs render`. Never execute Next.
