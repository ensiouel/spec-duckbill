---
description: Initialize a safe Duckbill feature workspace and state
argument-hint: "<feature> [description]"
---

Initialize feature `$1`; optional product description is `${@:2}`.

## Package bootstrap

Before preflight or any write, find the exact `duckbill-artifacts` `<location>` in Pi's `<available_skills>`. Resolve `<package-root>` as `../..` from the directory containing that `SKILL.md`, canonicalize it, and require `<package-root>/package.json` to have `name: "spec-duckbill"`, `pi.prompts: ["./prompts"]`, and `pi.skills: ["./skills"]`. Resolve runtime only from `<package-root>/scripts/` and templates only from `<package-root>/templates/`; canonicalize each used file and require it to remain inside that package root. Invoke runtime scripts only through `node <package-root>/scripts/<script>.mjs ...`, never as bare executables. Never fall back to similarly named project files or guessed npm/Git install directories. Looking up the skill location does not invoke the skill. If bootstrap is missing, ambiguous, or invalid, make no writes and return `blocked` with the bootstrap error.

## Permissions

May create `.duckbill/constitution.md` only when absent, `.duckbill/specs/$1/`, and its `state.json`. Everything else is read-only. No semantic skill is used.

## Flow

1. Require a Git repository root and one safe kebab-case feature argument. Require the regular bundled file `<package-root>/templates/constitution.md`.
2. Capture a repository snapshot with `<package-root>/scripts/repository.mjs snapshot`.
3. Run `<package-root>/scripts/repository.mjs init-feature --feature $1 --template <package-root>/templates/constitution.md`. Treat traversal, symlink traversal, an existing feature directory, or an unsafe target as blocked.
4. Run `<package-root>/scripts/state.mjs init --feature $1`. Do not create spec.md, plan.md, or tasks.md.
5. Run `<package-root>/scripts/repository.mjs boundary` against the pre-snapshot and the allowlist containing only the optional constitution plus canonical state path. Never clean or reset pre-existing changes.
6. Build one structured command result. Next is `duck-spec` with the feature and optional description.
7. Render only through `<package-root>/scripts/utils.mjs render`. Never execute Next.
