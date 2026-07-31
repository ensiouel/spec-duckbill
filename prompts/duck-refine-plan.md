---
description: Refine plan intent and truthful execution state without changing specification or code
argument-hint: "<plan-file>[#L<line>[-<end>]] <step|whole> <feedback>"
---

Refine plan `$1`, target `$2`, from feedback `${@:3}`.

Example: `/duck-refine-plan specs/plans/user-auth/plan.md hash-password Split hashing from registration`

This command MAY change plan intent and the execution state needed to keep evidence truthful. It MUST preserve
`spec-file` and MUST NOT change specification intent, implementation code, tests, configuration, or patches.

Plan intent: implementation approach/scope, prerequisite text/order, steps, context, Actions, Success Criteria
text/order, dependencies, mappings, validation definitions, risks, order, and structure. Execution state: their
checkmarks plus step `Execution` fields and global `Base Tree`, `Current Step`, `Attempt`, `Patch`, `Patch Status`.

Output MUST be exactly three lines, in order, with nothing else:

```text
Changed: <plan-file or none>
Status: <result and reason>
Next: <one exact Duckbill command or none>
```

Flow:

1. Missing argument: return `blocked; usage: /duck-refine-plan <plan-file> <step|whole> <feedback>` with
   `Changed: none`, `Next: none`.
2. Parse canonical `specs/plans/<name>/plan.md` plus optional exact line fragment. Read the full plan and referenced
   context. Resolve target `whole` or one unique stable step ID, number, or heading. Invalid input returns `blocked`
   with no changes.
3. Read `spec-file`, its reciprocal `plan-file`, applicable instructions, and relevant implementation context. Both
   links MUST be canonical and reciprocal. On failure return `blocked; reciprocal specification link is invalid`;
   use `Next: /duck-spec <spec-file>` only when that existing specification has a missing/wrong `plan-file`, otherwise
   `Next: none`. Refinement MUST NOT repair metadata. Record specification, code, tests, and patches before writes.
4. Finish classification, permission checks, and clarification before mutation:

| Feedback | Action | Status | Next |
|---|---|---|---|
| specification-level change | STOP | `blocked; requested change belongs in the specification` | `/duck-refine-spec <spec-file> <normalized feedback>` |
| plan-level change or synchronization | continue | — | — |
| code defect in one `completed` step, earlier execution work exists | STOP | `unchanged; earlier execution work takes precedence` | first earlier `/duck-execute` |
| code defect in one `completed` step, no earlier work | STOP | `unchanged; plan intent is correct, completed implementation requires correction` | `/duck-refine-code <plan-file> <step-id> <normalized feedback>` |
| material unknown or no unique owning step | STOP | `blocked; material unknown: <concise clarification question>` | `none` |

   Execution work means new, unexecuted, `partial`, `failed`, or `stale`. With target `whole`, derive a unique code
   owner from mappings and evidence or classify a material unknown.
5. Load `duckbill-clarifier`, then `duckbill-plan-refiner` in read-only preflight. If a structural change would retire
   `Current Step` while it owns a valid `Base Tree`, STOP before writes with
   `blocked; current step patch ownership requires recovery: preserve one coherent outcome with the current ID or restore implementation to Base Tree`,
   `Next: none`. Treat the specification as read-only truth when synchronizing.
6. Apply the plan refinement. MUST preserve stable IDs for unchanged outcomes and create IDs for new outcomes. Determine
   affected executed steps; mark each `stale`, uncheck only evidence invalidated by revised intent, and reset affected
   prerequisite evidence. MUST NOT create Execution blocks for untouched steps, edit patches, or save `retired:` state.
7. Re-read the plan. Validate links, IDs, dependencies, mappings, order, Actions, criteria, and truthful state. Verify
   specification, code, tests, configuration, and patches unchanged.
8. Select the result:

| Outcome | Changed | Status | Next |
|---|---|---|---|
| plan changed; new/stale work | plan | `ready; execution required for <affected step IDs>` | first affected `/duck-execute` |
| intent unchanged; execution work exists | none | `unchanged; plan intent is already correct` | first required `/duck-execute` |
| intent unchanged; completed code defect | none | routed status above | `/duck-refine-code ...` |
| intent unchanged; no pending work/defect | none | `unchanged; <completed result>` | `none` |

Every STOP/blocked/routed result MUST leave all files and execution state unchanged. Routing invariant:
`plan intent changed → /duck-execute`; `plan intent unchanged + code defect → /duck-refine-code`. Recommendations
belong only in `Next` and never run automatically.
