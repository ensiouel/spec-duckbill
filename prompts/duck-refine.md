---
description: Refine specification, technical plan/task design, or one task's implementation
argument-hint: "<feature> --scope spec|plan|code [--task <task-id>] <feedback>"
---

Refine feature `$1` using the explicit scope and feedback.

## Package bootstrap

Before preflight or any write, find the exact `duckbill-artifacts` `<location>` in Pi's `<available_skills>`. Resolve `<package-root>` as `../..` from the directory containing that `SKILL.md`, canonicalize it, and require `<package-root>/package.json` to have `name: "spec-duckbill"`, `pi.prompts: ["./prompts"]`, and `pi.skills: ["./skills"]`. Resolve runtime only from `<package-root>/scripts/`; canonicalize each used file and require it to remain inside that package root. Invoke runtime scripts only through `node <package-root>/scripts/<script>.mjs ...`, never as bare executables. Never fall back to similarly named project files or guessed npm/Git install directories. If bootstrap is missing, ambiguous, or invalid, make no writes and return `blocked` with the bootstrap error.

## Permissions

- `spec`: only spec.md and state.json.
- `plan`: only plan.md, tasks.md, and state.json.
- `code`: task-scoped application code/tests/configuration and state.json.

Constitution is always read-only. A scope never receives another scope's write permission.

## Flow

1. Parse exactly one scope and non-empty feedback. Require `--task` only for code. Resolve state through `<package-root>/scripts/state.mjs read`, artifacts, persisted clarification/repair context, and canonical paths. A current repair for the same task resumes with the feedback/references stored in state and skips begin after startedFrom checks; any different current operation routes to its exact stored command.
2. Capture `<package-root>/scripts/repository.mjs snapshot`, pre-existing changes, relevant artifact preimages, and the scope allowlist.
3. For `spec`, invoke `duckbill-artifacts:refine-spec`. Run `<package-root>/scripts/check.mjs spec` and enforce a spec.md-only semantic `<package-root>/scripts/repository.mjs boundary` before `<package-root>/scripts/state.mjs invalidate-spec` from the preimage. Then enforce the full spec.md/state.json boundary. Plan/tasks/evidence/feature validation become stale as computed. Next is `duck-sync $1`.
4. For `plan`, invoke `duckbill-artifacts:refine-plan` only after comparing feedback with specification. A contradiction returns blocked with no artifact write. Otherwise run `<package-root>/scripts/check.mjs all` and enforce a plan.md/tasks.md-only `<package-root>/scripts/repository.mjs boundary` before `<package-root>/scripts/state.mjs reconcile`. Then enforce the full artifact/state boundary. Preserve unaffected evidence. Next is `duck-analyze $1 --scope all`.
5. For `code`, run all execute preflight checks and invoke `duckbill-implementation:repair` phase `preflight` with no writes. Specification-owned feedback routes to spec refinement; plan-owned feedback routes to plan refinement. After an implementation-owned result, run `<package-root>/scripts/state.mjs begin --type repair`, invoke phase `apply`, enforce `<package-root>/scripts/repository.mjs boundary` with the task allowlist, invoke `duckbill-validation:validate-task`, and run `<package-root>/scripts/state.mjs finish` with complete current CHK evidence.
6. Persist and resume any semantic clarification through `<package-root>/scripts/state.mjs`. A repair always uses the persisted original feedback/references when resuming.
7. Build one structured result and render only through `<package-root>/scripts/utils.mjs render`. Never update higher intent to match code and never execute Next.
