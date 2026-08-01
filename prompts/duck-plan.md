---
description: Create plan intent and initialize isolated workflow state from a ready specification
argument-hint: "<spec-file>"
---

Create or inspect the plan for specification `$1`.

Example: `/duck-plan specs/user-auth.md`

This command MAY change `plan.md` and plan-local `state.json`. Specification intent and implementation code are
read-only.

Output MUST be exactly three lines, in order, with nothing else:

```text
Changed: <plan.md, state.json, or none>
Status: <result and reason>
Next: <one exact Duckbill command or none>
```

## Isolation invariant

Load `duckbill-state` independently and use only its bundled deterministic CLI. This command is the sole orchestrator:
load workers independently and give them only canonical artifacts and resolved user input—the original request plus
direct user answers—never workflow state or another worker's report.

## Flow

1. Empty path: return `blocked; usage: /duck-plan <spec-file>` with no changes.
2. Require an existing repository-relative ready specification, applicable instructions, canonical
   `plan-file: specs/plans/<name>/plan.md`, and no line fragment. Invalid or draft input blocks without writes.
3. Load `duckbill-clarifier` independently for the readiness gate. A specification gap routes to specification
   refinement; a material planning unknown blocks before any write.
4. If the plan already exists:
   - restore only a missing/wrong `spec-file` backlink through plan-author metadata mode, then stop;
   - reject checkboxes or embedded Execution blocks as an unsupported plan format without writes;
   - for a clean ID-based plan without state, call the state CLI `init`;
   - otherwise read state and route changed plan/specification to plan refinement, a running or pending step to its
     exact `/duck-execute` command, validation to `/duck-execute` for the last step, and a complete plan to `none`.
5. For a new plan, load `duckbill-plan-author` independently with the specification, verified project facts, and
   resolved user input. Resolve material unknowns before writing and validate the returned plan.
6. Initialize state only after plan validation by calling the state CLI `init`.
7. If initialization or post-write verification fails, remove only files created by this invocation and restore the
   exact prior plan when applicable. Never leave a new plan without valid state.
8. Re-read plan and state. Success returns the exact first execution command, validation command, or `none`.
   Never run the recommendation automatically.
