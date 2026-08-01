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

Evaluate every criterion in plan order and preserve its stable `SC-###` ID. A `passed` result requires direct current
evidence. Use `failed` when current evidence reveals a violation and `blocked` when proof cannot be obtained. MUST NOT
reuse prior evidence after related code changes.

| Status | Meaning |
|---|---|
| `completed` | every criterion passes |
| `partial` | implementation changed; at least one criterion failed/unproven |
| `failed` | no intended implementation outcome was produced |

## Report Template

```markdown
## Step Execution: <step ID, number, title>

**Status:** completed | partial | failed

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

- SC-001 — passed | failed | blocked: <evidence>

### Blockers and Assumptions

- <item or None>
```

The caller owns plan-level validation, the strict three-line command result, and `Next`; MUST NOT add a next-command
recommendation here.

MUST preserve requirement mappings and all plan intent. Report selected-step evidence only; do not derive plan-wide
coverage or persist workflow state.
