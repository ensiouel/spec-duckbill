---
description: Read-only semantic consistency analysis of a specification or complete feature
argument-hint: "<feature> --scope spec|all"
---

Analyze feature `$1` with scope selected by `--scope`.

## Package bootstrap

Before preflight, find the exact `duckbill-artifacts` `<location>` in Pi's `<available_skills>`. Resolve `<package-root>` as `../..` from the directory containing that `SKILL.md`, canonicalize it, and require `<package-root>/package.json` to have `name: "spec-duckbill"`, `pi.prompts: ["./prompts"]`, and `pi.skills: ["./skills"]`. Resolve runtime only from `<package-root>/scripts/`; canonicalize each used file and require it to remain inside that package root. Invoke runtime scripts only through `node <package-root>/scripts/<script>.mjs ...`, never as bare executables. Never fall back to similarly named project files or guessed npm/Git install directories. If bootstrap is missing, ambiguous, or invalid, remain read-only and return `blocked` with the bootstrap error.

## Permissions

All repository paths are read-only. Do not create a report file or update state.

## Flow

1. Parse arguments strictly and require scope `spec` or `all`.
2. Resolve canonical paths. For `spec`, run `<package-root>/scripts/check.mjs spec`; for `all`, run `<package-root>/scripts/check.mjs all`, `<package-root>/scripts/state.mjs status`, and `<package-root>/scripts/repository.mjs` evidence drift checks.
3. Invoke `duckbill-consistency` mode `analyze-spec` or `analyze-all` with constitution, explicit artifact inputs, deterministic findings, and only relevant repository context.
4. Merge deterministic and semantic findings without hiding either. Any CRITICAL or HIGH finding yields structured status `blocked`; otherwise status is `completed` or `unchanged` as appropriate.
5. Next is `duck-plan $1` after a clean spec analysis, `duck-execute $1 <eligible-task>` after a clean all analysis, or the exact owning refinement/sync command for a blocking finding.
6. Compare before/after `<package-root>/scripts/repository.mjs snapshot` results and require no path change. Render only through `<package-root>/scripts/utils.mjs render` and never execute Next.
