---
description: Refine plan intent without changing specification or code
argument-hint: "<plan-file>[#L<line>[-<end>]] <step|whole> <feedback>"
---

Refine plan `$1`, target `$2`, from feedback `${@:3}`.

Example: `/duck-refine-plan specs/plans/user-auth/plan.md hash-password Split hashing from registration`

This command MAY change `plan.md` and mechanically synchronize plan-local `state.json`. It MUST preserve `spec-file`
and MUST NOT change specification intent, implementation code, tests, or configuration.

Output MUST be exactly three lines, in order, with nothing else:

```text
Changed: <plan.md, state.json, or none>
Status: <result and reason>
Next: <one exact Duckbill command or none>
```

## Isolation invariant

Load `duckbill-state` independently and use only its bundled deterministic CLI for workflow-state operations.

This command is the sole orchestrator. Skills never invoke each other or receive each other's reports. The plan worker
receives canonical plan/specification/project files plus resolved user input: original feedback and direct user
answers, but no state or another skill's analysis. State reading and synchronization remain private to orchestration.

## Flow

1. Missing argument: return `blocked; usage: /duck-refine-plan <plan-file> <step|whole> <feedback>` with no changes.
2. Resolve a canonical plan, optional valid line fragment, and target `whole` or one stable step ID. Require reciprocal
   specification/plan links. Refinement never repairs metadata.
3. Read state. Missing state routes to `/duck-plan`; invalid plan or state blocks. If `currentStep` is set while plan
   and specification hashes are current, stop and route to `/duck-execute <plan-file> <currentStep>`. When either hash
   changed, synchronization may proceed and will safely reset that interrupted attempt.
4. Load `duckbill-clarifier` independently only for a material ambiguity in the original feedback. Load
   `duckbill-plan-refiner` independently in preflight using only canonical artifacts and resolved user input. Continue
   for a plan-level change or specification synchronization. Route specification changes, governed code defects, and
   material unknowns to their owner without writes.
5. Authorize the plan worker to update only `plan.md`. Preserve every step/check ID whose meaning is unchanged; assign
   a new ID when meaning changes. Definitions remain plain ID-prefixed bullets with no status or evidence. The worker
   returns affected step IDs to orchestration.
6. Validate reciprocal links, unique stable IDs, mappings, dependencies, actions, criteria, and absence of embedded
   operational state. Then call the state CLI `sync-plan --affected <step-ids|none>`. It updates hashes, adds/removes plan
   steps, resets affected or no-longer-complete steps, filters retired check results, clears final validation, and
   closes an interrupted running attempt when hashes changed.
7. If validation or synchronization fails, restore this command's exact `plan.md` preimage. State is unchanged because
   synchronization validates before its atomic write. Never hand-edit `state.json`.
8. Re-read plan and state. Changed or newly pending work routes to the first exact `/duck-execute` command. A
   synchronized complete plan returns `Next: none`. Recommendations never run automatically.
