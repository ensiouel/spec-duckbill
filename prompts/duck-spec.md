---
description: Create a ready WHAT-and-WHY specification for one initialized feature
argument-hint: "<feature> [description]"
---

Create specification for `$1` from optional description `${@:2}` and any persisted clarification answers.

## Package bootstrap

Before preflight or any write, find the exact `duckbill-artifacts` `<location>` in Pi's `<available_skills>`. Resolve `<package-root>` as `../..` from the directory containing that `SKILL.md`, canonicalize it, and require `<package-root>/package.json` to have `name: "spec-duckbill"`, `pi.prompts: ["./prompts"]`, and `pi.skills: ["./skills"]`. Resolve runtime only from `<package-root>/scripts/` and templates only from `<package-root>/templates/`; canonicalize each used file and require it to remain inside that package root. Invoke runtime scripts only through `node <package-root>/scripts/<script>.mjs ...`, never as bare executables. Never fall back to similarly named project files or guessed npm/Git install directories. If bootstrap is missing, ambiguous, or invalid, make no writes and return `blocked` with the bootstrap error.

## Permissions

May write only canonical spec.md and state.json. Constitution, plan, tasks, application code, tests, and configuration are read-only.

## Flow

1. Resolve canonical paths with `<package-root>/scripts/repository.mjs feature-paths`; load state, constitution, `<package-root>/templates/specification.md`, project instructions, description, and relevant observable project facts. If the same command has pending clarification, resume it through `<package-root>/scripts/state.mjs resume` using the stored command/mode/arguments.
2. Capture the repository snapshot and pre-existing changed paths through `<package-root>/scripts/repository.mjs snapshot`. Allow only spec.md and state.json.
3. Invoke `duckbill-artifacts` with mode `create-spec`, the specification template as starting structure, explicit inputs, and those permissions. Normative format rules still come from the skill references, not the template.
4. On `needs_clarification`, save the complete context through `<package-root>/scripts/state.mjs clarify`, show only the returned questions, and stop without a terminal result.
5. Run `<package-root>/scripts/check.mjs spec` and require `status: ready`. Enforce a spec.md-only `<package-root>/scripts/repository.mjs boundary` against the pre-snapshot before any state success write. Unauthorized writes block success and are not reset.
6. After the boundary passes, run `<package-root>/scripts/state.mjs record-spec` with the expected revision. Run a final `<package-root>/scripts/repository.mjs boundary` against the original snapshot and the full spec.md/state.json allowlist.
7. Build a structured result with Next `duck-analyze $1 --scope spec`, then render only through `<package-root>/scripts/utils.mjs render`. Never execute Next.
