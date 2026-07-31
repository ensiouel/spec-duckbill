---
description: Execute exactly one plan step without changing specification or plan intent
argument-hint: "<plan-file> <step-id>"
---

Execute step `$2` from plan `$1`.

Example: `/duck-execute specs/plans/user-auth/plan.md hash-password`

This command MAY change implementation code, tests, the selected step patch, and plan execution state. It MUST NOT
change specification intent or plan intent: approach/scope, prerequisite text/order, context, Actions, Success Criteria
text/order, dependencies, validation definitions, risks, structure, or mappings.

Output MUST be exactly three lines, in order, with nothing else:

```text
Changed: <implementation files, tests, plan state, patch, or none>
Status: <result and reason>
Next: <one exact Duckbill command or none>
```

Flow:

1. Missing argument: return `blocked; usage: /duck-execute <plan-file> <step-id>` with `Changed: none`, `Next: none`.
2. Require canonical `specs/plans/<name>/plan.md` and resolve one unique stable step ID, number, or heading. Invalid or
   ambiguous input returns `blocked` with no changes and `Next: none`, unless one exact canonical repair command is
   known.
3. Find the first step in plan order that is new/unexecuted, `partial`, `failed`, or `stale`, or has an unchecked
   Success Criterion. Only that step is executable. If another step was selected, return
   `unchanged; an earlier step requires execution` and its exact `/duck-execute` in `Next`.
   If no step qualifies:
   - completed `Current Step` plus `Patch Status: unavailable: <reason>` and valid `Base Tree`: select it only in
     patch-recovery mode;
   - complete final Validation Checklist and no recovery: return `unchanged; plan is completed`, `Next: none`;
   - incomplete final validation: perform only read-only preflight/final-failure classification and return its route.
4. Read the governing specification from plan `spec-file`; require its reciprocal `plan-file` to select this plan.
   Missing/invalid governing spec returns `blocked; governing specification link is invalid`, `Next: none`. A valid
   specification with a bad backlink returns `blocked; reciprocal plan link is invalid`,
   `Next: /duck-spec <spec-file>`. Read instructions, step/dependencies, and current code. Record all governed artifacts
   before writes.
5. Load `duckbill-step-executor` in preflight mode. Complete permissions, prerequisites, dependencies, classification,
   and clarification before any mutation; MUST NOT perform Actions or change execution state in preflight:

| Finding | Status | Next |
|---|---|---|
| specification intent missing/contradictory/wrong | `blocked; specification intent requires refinement` | `/duck-refine-spec <spec-file> <normalized feedback>` |
| plan intent must change | `blocked; plan intent requires refinement` | `/duck-refine-plan <plan-file> <step-id-or-whole> <normalized feedback>` |
| material implementation unknown not owned by the plan | `blocked; material unknown: <concise clarification question>` | `none` |
| prerequisite lacks evidence | `blocked; <reason>` | exact owning command, or `none` for external action |

   Plan intent includes every immutable field listed above. Any blocked result MUST use `Changed: none` and leave every
   repository file and every execution-state field byte-for-byte unchanged. After preflight passes, prerequisite
   checkmarks MAY be updated from current evidence; their text/order remain immutable.
6. Load `duckbill-step-patch`. A `Current Step` value `retired:<old-id>` MUST block before mutation with
   `blocked; retired current-step patch ownership requires plan-level recovery` and
   `Next: /duck-refine-plan <plan-file> whole Resolve retired current-step patch ownership`.
7. Prepare isolated state:
   - first execution: create `Execution State` lazily;
   - no Current Step or a different current step: capture a fresh `Base Tree` immediately before code changes;
   - same current step retry: require and reuse its valid `Base Tree`; an invalid baseline blocks without writes;
   - normal attempt: initialize from the step's prior Attempt or `0`, increment once, store the same global/per-step
     Attempt, set Current Step/Patch, set Patch Status `building`, and reset only affected evidence;
   - patch recovery: preserve Base Tree, Current Step, both Attempt values, Files Changed, statuses, and checkmarks;
     set only Patch Status `building` and skip implementation.
   MUST NOT divide or overwrite another step's patch.
8. In normal mode resume `duckbill-step-executor` in execution mode and implement only the selected step. Persist its
   evidence-based `completed|partial|failed` status, Attempt, Files Changed, and checkmarks without changing intent.
9. Rebuild only `<plan-directory>/steps/<step-id>.patch` from Base Tree; set Patch Status `current` or
   `unavailable: <exact reason>`. Patch recovery MUST NOT change implementation or create an Attempt. If this is the last
   implementation step, run and persist every final Validation Checklist item unless recovery preserves current proof.
10. Classify each failed final-validation item:

| Owner | Next |
|---|---|
| selected step | `/duck-execute <plan-file> <step-id>`; keep it `partial` or `failed` |
| another unique `completed` step | `/duck-refine-code <plan-file> <affected-step-id> <normalized feedback>` |
| plan intent | `/duck-refine-plan ...` |
| specification intent | `/duck-refine-spec ...` |
| material unknown or external action | `none` |

   Final validation MUST NOT edit implementation outside the selected step.
11. Re-read plan, patch, changed code, and checks. Verify intent unchanged and state truthful. If a higher-level blocker
   escaped preflight, undo only this command's mutations and verify all recorded pre-command artifacts byte-for-byte
   before returning the blocked result.
12. Final status is `completed|partial|failed; <step and overall result>`. A successful patch-only retry is
   `completed; patch recovered for <step-id>`. `Next` is the first required `/duck-execute`, the classified validation
   route, or `none` only when completed or no exact Duckbill action is known. Recommendations belong only in `Next` and
   never run automatically.
