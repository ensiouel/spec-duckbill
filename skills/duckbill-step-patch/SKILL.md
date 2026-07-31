---
name: duckbill-step-patch
description: Capture a Git working-tree baseline without changing the real index and build one isolated plan-step patch. Use around step execution or completed-step code repair.
---

# Duckbill Step Patch

Resolve `scripts/step-patch.mjs` relative to this file. Run in a Git repository with Node and Git; a commit is optional.

## Snapshot

Before code changes:

```bash
node <skill-directory>/scripts/step-patch.mjs snapshot --repo <repository-root>
```

Store JSON `tree` as plan `Base Tree`. The script captures tracked and untracked non-ignored files through a temporary
index and MUST NOT change the real index.

## Build

After implementation and state updates:

```bash
node <skill-directory>/scripts/step-patch.mjs build \
  --repo <repository-root> \
  --base <base-tree> \
  --output <plan-directory>/steps/<step-id>.patch \
  --exclude <spec-file> \
  --exclude <plan-directory>/plan.md \
  --exclude '<plan-directory>/steps/*.patch'
```

These exclusions remove only governing Duckbill artifacts. MAY add project-specific generated/local exclusions. MUST
NOT exclude all `specs/**`; it may contain implementation or test data. The script excludes its output automatically.

## Rules

- Same Current Step retry/refinement MUST reuse its valid Base Tree and replace only its patch.
- Starting a different step, returning to a non-current attempted step, or repairing a completed non-current step MUST
  capture a fresh baseline immediately before edits, make it Current Step, and replace only its patch.
- MUST preserve every other step patch. MUST NOT divide one delta across patches or reuse an older baseline after later
  steps changed the tree.
- Output MUST stay inside the repository.
- MUST NOT use the real index or create commits, branches, stashes, or worktrees.
