---
name: duckbill-init
description: Initialize one safe Duckbill feature workspace with a project constitution, editable draft specification, and state. Use only for the `/duck-init` command; do not develop specification intent, create a plan, or modify application code.
---

# Duckbill Init

Create the deterministic starting workspace for one feature.

## Contract

Treat the directory containing this `SKILL.md` as `<init-root>`. Run initialization only as:

```text
node <init-root>/scripts/init.mjs init --repo <repository-root> --feature <feature-id> [--description <text>]
```

The script owns the complete operation. It uses only its bundled `assets/constitution.md` and `assets/draft.md`, validates the repository and feature slug, creates the canonical draft and state, enforces the write boundary, and returns one structured command result.

Render that result only through:

```text
node <init-root>/scripts/init.mjs render --json <structured-result>
```

## Resource safety

- Resolve the init script, constitution, and draft relative to `<init-root>`.
- Canonicalize every bundled resource and require it to remain inside `<init-root>`.
- Require every resource to be a regular non-symlink file.
- Never substitute project files, search for a package root, or derive an installed-package path.

## Boundaries

Permit only the optional `.duckbill/constitution.md`, canonical draft `spec.md`, and canonical `state.json` writes. Do not create plan.md or tasks.md, inspect code for intent, invoke another skill, ask the user questions, choose another command, or execute the returned `next` value.
