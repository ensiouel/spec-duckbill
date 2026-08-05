---
description: Validate current feature implementation and persist only validation evidence
argument-hint: "<feature>"
---

Validate feature `$1`.

## Package bootstrap

Before preflight or any write, find the exact `duckbill-artifacts` `<location>` in Pi's `<available_skills>`. Resolve `<package-root>` as `../..` from the directory containing that `SKILL.md`, canonicalize it, and require `<package-root>/package.json` to have `name: "spec-duckbill"`, `pi.prompts: ["./prompts"]`, and `pi.skills: ["./skills"]`. Resolve runtime only from `<package-root>/scripts/`; canonicalize each used file and require it to remain inside that package root. Invoke runtime scripts only through `node <package-root>/scripts/<script>.mjs ...`, never as bare executables. Never fall back to similarly named project files or guessed npm/Git install directories. If bootstrap is missing, ambiguous, or invalid, make no writes and return `blocked` with the bootstrap error.

## Permissions

All code and Markdown artifacts are read-only. Only validation/evidence fields in canonical state.json may change through `<package-root>/scripts/state.mjs`.

## Flow

1. Resolve canonical paths and run `<package-root>/scripts/check.mjs all`, `<package-root>/scripts/state.mjs status`, `<package-root>/scripts/repository.mjs snapshot` with observed paths, and read-only `duckbill-consistency:analyze-all`.
2. Require ready/current artifacts, no CRITICAL/HIGH finding, all non-retired tasks completed, current task evidence, no current operation/pending clarification, and no relevant repository drift. Otherwise return blocked without invoking semantic validation.
3. Retain the pre-snapshot and allow only state.json.
4. Invoke `duckbill-validation` mode `validate-feature`. Evaluate every VAL exactly once and bind each record to current artifacts, repository snapshot, observed paths, command result, and output digest.
5. Run `<package-root>/scripts/state.mjs record-validation`. Enforce `<package-root>/scripts/repository.mjs boundary` against the pre-snapshot and state.json-only allowlist; never repair code or create tasks.
6. Render the structured result through `<package-root>/scripts/utils.mjs render`. Next is none on passed validation or the explicit refine scope needed by the failure. Never execute Next.
