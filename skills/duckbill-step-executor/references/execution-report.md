# Step Execution Evidence and Report

## Evidence

Use the strongest practical current evidence:

| Claim | Evidence |
|---|---|
| file/symbol | inspect final file or search symbol |
| behavior | focused test or safe reproduction |
| build/type | relevant build/compile/type-check |
| format/static quality | project formatter/linter/analyzer |
| configuration | normal parser/validation command |
| integration | narrowest reliable integration test |

Writing code is not proof. A command proves only what its checks/output observe; a test name proves nothing beyond its
body. Evidence MUST be capable of revealing a violation. Protective/boundary behavior needs a negative or edge case.

Copy every criterion exactly and in order. Evaluate every clause; if one is unproven, keep the full criterion `[ ]` and
name the missing proof. `[x]` requires direct current evidence. Failed, skipped, blocked, unavailable, and unproven
checks remain `[ ]`; MUST NOT reuse prior evidence after related code changes.

| Status | Meaning |
|---|---|
| `completed` | every criterion passes |
| `partial` | implementation changed; at least one criterion failed/unproven |
| `failed` | no intended implementation outcome was produced |

## Report Template

```markdown
## Step Execution: <step ID, number, title>

**Status:** completed | partial | failed
**Attempt:** <number>

### Summary

<Implemented result.>

### Files Changed

- Created: <paths or None>
- Modified: <paths or None>
- Deleted: <paths or None>

### Commands and Checks

- `<command>` - passed | failed: <reason>
- Inspection - <evidence>

### Success Criteria

- [x] <exact criterion> - <evidence>
- [ ] <exact criterion> - <failure or missing evidence>

### Plan Validation

- [x] **AC-001:** <exact item> - <evidence>
- [ ] **NFR-001:** <exact item> - <failure or missing evidence>

**Plan Status:** completed | incomplete

### Requirement Coverage

- FR-001: verified | partial | pending - <evidence or remaining work>

### Blockers and Assumptions

- <item or None>
```

Omit Plan Validation unless this attempt would complete all implementation steps. The caller owns the strict
three-line command result and `Next`; MUST NOT add a next-command recommendation here.

## Coverage

MUST preserve requirement mappings and all plan intent. The caller MAY persist checkmarks and other execution state.
Use `verified` only when mapped work and requirement-level validation pass, `partial` for incomplete proof with valid
evidence, and `pending` when changed/failed work leaves insufficient evidence.

## Final Validation

After the last incomplete step becomes completed:

1. Run every checklist item in exact order against the combined implementation; preserve its ID prefix.
2. Use end-to-end/cross-step checks where appropriate. MUST NOT infer results from saved step checkboxes.
3. The plan is `completed` only when all prerequisites, step statuses/criteria, and checklist items pass.
4. MUST NOT edit outside the selected step to force a pass.
5. Classify each failure owner: selected step, another unique `completed` step, plan intent, specification intent, or
   material/external blocker. The caller routes respectively to `/duck-execute`, `/duck-refine-code`,
   `/duck-refine-plan`, `/duck-refine-spec`, or `Next: none`.
