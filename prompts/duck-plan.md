---
description: Create plan intent from a ready specification without changing the specification or code
argument-hint: "<spec-file>"
---

Create a plan from specification `$1`.

Example: `/duck-plan specs/user-auth.md`

This command MAY change only the plan level. Specification intent and implementation code are read-only.

Output MUST be exactly three lines, in order, with nothing else:

```text
Changed: <changed plan or none>
Status: <result and reason>
Next: <one exact Duckbill command or none>
```

Flow:

1. Empty path: return `blocked; usage: /duck-plan <spec-file>` with `Changed: none`, `Next: none`.
2. Require an existing repository-relative specification with no line fragment. Read it and applicable project
   instructions. Invalid input returns `blocked` with no changes. A draft returns
   `blocked; specification draft is incomplete` and `Next: /duck-spec <spec-file>`.
3. Load `duckbill-clarifier` and apply the specification readiness gate. Incomplete or contradictory specification
   intent returns `blocked; specification intent is not ready` and
   `Next: /duck-refine-spec <spec-file> <normalized feedback>` without writes.
4. Derive `specs/plans/<name>/plan.md`. Before writing, require specification `plan-file` to equal it. Otherwise return
   `blocked; specification plan-file is missing or noncanonical` and `Next: /duck-spec <spec-file>`.
5. If the plan exists, MUST NOT overwrite plan intent or execution state. Validate it read-only, except:
   - invalid/missing `spec-file` backlink: metadata-recovery mode MAY set only `spec-file: <spec-file>`, then return
     `completed; reciprocal specification link restored`;
   - valid, synchronized, executable: return `unchanged; existing plan is executable` and the first exact
     `/duck-execute` command;
   - valid, synchronized, completed: return `unchanged; existing plan is completed`, `Next: none`;
   - otherwise: return `unchanged; existing plan requires synchronization` and
     `Next: /duck-refine-plan <plan-file> whole Synchronize with the current specification`.
   After backlink recovery, select `Next` by the same synchronized/executable rules. Do not continue to authoring.
6. For a new plan, record the specification and implementation tree, load `duckbill-plan-author`, and inspect the
   project. Resolve unknowns through `duckbill-clarifier` before writes:

| Unknown | Status | Next |
|---|---|---|
| specification-level | `blocked; specification intent is incomplete` | `/duck-refine-spec <spec-file> <normalized feedback>` |
| plan-level | `blocked; material unknown: <concise clarification question>` | `none` |

7. Write only the new plan with reciprocal `spec-file`. A new plan MUST have unchecked evidence and MUST NOT contain
   `Execution State` or per-step `Execution` blocks. MUST NOT edit the specification, code, or execute a step.
8. Re-read it and validate reciprocal links, stable IDs, mappings, dependencies, Actions, Success Criteria, commands,
   and clean lazy execution state. Verify specification and implementation unchanged.
9. Success:

```text
Changed: <plan-file>
Status: ready; plan intent verified and execution state not created
Next: /duck-execute <plan-file> <first executable step ID>
```

Every blocked result MUST leave all files unchanged. Recommendations belong only in `Next`; they never run automatically.
