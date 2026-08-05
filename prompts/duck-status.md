---
description: Show deterministic Duckbill feature, staleness, drift, and next-command status
argument-hint: "<feature>"
---

Show status for `$1`.

## Package bootstrap

Before preflight, find the exact `duckbill-artifacts` `<location>` in Pi's `<available_skills>`. Resolve `<package-root>` as `../..` from the directory containing that `SKILL.md`, canonicalize it, and require `<package-root>/package.json` to have `name: "spec-duckbill"`, `pi.prompts: ["./prompts"]`, and `pi.skills: ["./skills"]`. Resolve runtime only from `<package-root>/scripts/`; canonicalize each used file and require it to remain inside that package root. Invoke runtime scripts only through `node <package-root>/scripts/<script>.mjs ...`, never as bare executables. Never fall back to similarly named project files or guessed npm/Git install directories. Looking up the skill location does not invoke the skill. If bootstrap is missing, ambiguous, or invalid, remain read-only and return `blocked` with the bootstrap error.

## Permissions

Strictly read-only. Do not invoke a semantic skill.

## Flow

1. Resolve the safe feature and run `<package-root>/scripts/state.mjs status`. This script reads current artifacts, hashes, task/evidence metadata, Git snapshot, and observed path hashes.
2. Display Feature, Spec status, Plan status, Tasks status, Current operation, Pending clarification, completed/pending/partial/failed/blocked task counts, artifact staleness, evidence staleness, feature validation, repository drift, and the exact Next command from the structured status.
3. Repository drift means only changed commit, dirty-tree hash, observed path, or artifact hash. Do not infer intent from changed code.
4. Compare before/after `<package-root>/scripts/repository.mjs snapshot` results and require no path change. Render the command result only through `<package-root>/scripts/utils.mjs render` and never execute Next.
