---
name: duckbill-runtime
description: Run Duckbill's shared deterministic Node.js checks, state transitions, repository safety operations, evidence drift checks, and structured result rendering when a Duckbill command requires runtime guarantees.
---

# Duckbill Runtime

Use the bundled scripts as the only executable authority for deterministic Duckbill behavior.

## Contract

Read `references/contracts.md` and `references/operations.md` for every operation. Accept only a typed runtime request, execute only its requested stage, and return the matching typed result. The calling prompt owns stage order and semantic skill selection.

## Resource paths

Treat the directory containing this `SKILL.md` as `<runtime-root>`.

- Run a bundled script only as `node <runtime-root>/scripts/<name>.mjs ...`.
- Resolve script paths relative to `<runtime-root>`.
- Canonicalize every resource path and require it to remain inside `<runtime-root>`.
- Require resources to be regular files, not symbolic links.
- Never substitute a similarly named file from the user's repository or search for a package root.

## Scripts

- `scripts/check.mjs`: parse and validate artifacts, IDs, mappings, coverage, and dependencies.
- `scripts/state.mjs`: validate and transition state with optimistic revision checks.
- `scripts/repository.mjs`: protect paths, provide safe initialization primitives, capture Git snapshots, and enforce write boundaries.
- `scripts/utils.mjs`: provide shared low-level primitives and render structured command results.

Preserve script output as structured data until `render`.

## Boundaries

Do not make semantic product or technical decisions. Do not infer intent from code, modify artifacts except through the requested runtime operation, invoke semantic skills, ask the user questions, or execute a returned `next` value.
