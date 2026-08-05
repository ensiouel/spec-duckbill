---
description: Execute and validate exactly one current Duckbill task
argument-hint: "<feature> <task-id>"
---

Execute task `$2` for feature `$1`.

## Package bootstrap

Before preflight or any write, find the exact `duckbill-artifacts` `<location>` in Pi's `<available_skills>`. Resolve `<package-root>` as `../..` from the directory containing that `SKILL.md`, canonicalize it, and require `<package-root>/package.json` to have `name: "spec-duckbill"`, `pi.prompts: ["./prompts"]`, and `pi.skills: ["./skills"]`. Resolve runtime only from `<package-root>/scripts/`; canonicalize each used file and require it to remain inside that package root. Invoke runtime scripts only through `node <package-root>/scripts/<script>.mjs ...`, never as bare executables. Never fall back to similarly named project files or guessed npm/Git install directories. If bootstrap is missing, ambiguous, or invalid, make no writes and return `blocked` with the bootstrap error.

## Permissions

May write task-scoped application code, tests, configuration, and canonical state.json. Constitution, spec.md, plan.md, and tasks.md are read-only.

## Flow

1. Resolve canonical paths; run `<package-root>/scripts/check.mjs all`, `<package-root>/scripts/state.mjs status`, `<package-root>/scripts/repository.mjs stale-evidence`, and `duckbill-consistency` mode `analyze-all`. A current execute for this same task resumes its persisted operation without another begin after startedFrom checks; a different current operation routes to its exact stored command. Otherwise require ready/current artifacts, no CRITICAL/HIGH finding, the selected executable status, completed dependencies with current evidence, valid mappings, and no pending clarification/current operation. Evaluate every PRE item when missing/stale and persist the complete current set through `<package-root>/scripts/state.mjs record-prerequisites` before begin; block on any failed or unavailable prerequisite.
2. Derive and verify an explicit task-scoped implementation/test/config allowlist from the selected task and repository facts. Capture `<package-root>/scripts/repository.mjs snapshot` including pre-existing changes.
3. Invoke `duckbill-implementation` mode `execute`, phase `preflight`, with an empty write set. Route higher-level conflicts before any transition. Persist a material clarification through `<package-root>/scripts/state.mjs`, show only questions, and resume from state on the next invocation.
4. After an implementation-owned preflight, run `<package-root>/scripts/state.mjs begin --type execute --task $2 --command duck-execute` with expected revision unless this is the verified same-task resume. Invoke the same skill in phase `apply` for only this task.
5. Run `<package-root>/scripts/repository.mjs boundary` against the pre-snapshot and task allowlist before success. If unauthorized paths exist, validate available evidence, finish the attempt as blocked, list those paths, and never reset them.
6. Invoke `duckbill-validation` mode `validate-task`. Enrich every CHK record with current artifact hashes, commit, dirty-tree hash, observed path hashes, command exit code, and output digest. Run `<package-root>/scripts/state.mjs finish` with every CHK exactly once and the resulting outcome.
7. Re-read state. Next is the exact command for one pending task, `duck-validate $1` when all required tasks are completed, or the explicit owning refinement command on conflict. Render only through `<package-root>/scripts/utils.mjs render` and never execute Next or another task.
