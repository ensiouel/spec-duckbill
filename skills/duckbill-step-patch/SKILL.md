---
name: duckbill-step-patch
description: Capture the current Git working tree without changing the real index and build a patch containing only one plan step's implementation changes. Use before and after step execution or code refinement when Spec Duckbill needs an isolated patch next to a plan.
---

# Duckbill Step Patch

Use the bundled script to capture a step baseline and build its current implementation patch.

Resolve `scripts/step-patch.mjs` relative to this `SKILL.md` and run it by its resolved path while passing the target repository through `--repo`.

## Requirements

- Run inside an initialized Git repository with `git` and `node`. A commit is not required; an unborn repository uses the empty tree as its starting point.
- Keep the returned base tree for the current step until review and refinement finish.

## Capture the Step Baseline

Run before changing code:

```bash
node <this-skill-directory>/scripts/step-patch.mjs snapshot --repo <repository-root>
```

Read the JSON result and store its `tree` value in the plan's `Execution State`. The calling prompt creates that section on first execution when it is absent.

The script uses a temporary Git index. It includes tracked modifications and untracked, non-ignored files without staging anything in the real index.

## Build the Step Patch

Run after implementation and plan status updates:

```bash
node <this-skill-directory>/scripts/step-patch.mjs build \
  --repo <repository-root> \
  --base <base-tree> \
  --output <plan-directory>/steps/<step-id>.patch \
  --exclude <spec-file> \
  --exclude <plan-directory>/plan.md \
  --exclude '<plan-directory>/steps/*.patch'
```

The patch compares the current working tree with the supplied step baseline. The explicit exclusions keep only the
governing specification, plan state, and generated step patches out of the implementation patch. The script always
excludes its own output path.

Use additional repeated `--exclude <git-pathspec-pattern>` arguments only when the project requires other generated or
local paths to be omitted. Never exclude the entire `specs/**` tree because it may contain project code or test data.

## Rules

- Capture a new baseline when starting a different plan step.
- You MUST reuse the existing baseline when refining the current step and overwrite only that step's patch.
- Write the patch only inside the target repository.
- You MUST NOT use `git add` against the real index.
- You MUST NOT create commits, branches, stashes, or worktrees.
- Do not build an isolated patch for a different step after subsequent steps have started.
- Preserve patch files belonging to other step IDs.
