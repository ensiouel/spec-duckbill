# Step Execution Evidence and Report

Read this reference before reporting execution results.

## Contents

- Evidence Rules
- Report Format
- Requirement Coverage
- Examples

## Evidence Rules

Match each success criterion to the strongest practical evidence:

| Criterion type               | Suitable evidence                                             |
|------------------------------|---------------------------------------------------------------|
| File or symbol exists        | Inspect the final file or search for the symbol               |
| Behavior                     | Run a focused automated test or a safe local reproduction     |
| Build or type safety         | Run the relevant build, compile, or type-check command        |
| Formatting or static quality | Run the project's formatter check, linter, or static analyzer |
| Configuration                | Parse or validate it with the project's normal command        |
| Integration                  | Run the narrowest reliable integration test                   |

Do not mark a criterion passed merely because code was written. If a relevant command cannot run, report the reason and
leave the criterion unchecked unless another direct check fully proves it.

Evaluate every claim inside a criterion:

- a criterion joined by `and`, commas, or multiple sentences passes only when evidence covers every claim;
- a passing command proves only the behavior asserted by its checks or visible in its output;
- a test name is not evidence for behavior that the test body does not assert;
- evidence must be capable of revealing a violation of the claimed behavior;
- a boundary or protective claim needs an appropriate negative or edge scenario.

If one claim remains unproven, keep the entire original criterion unchecked, name the missing claim, and use `partial`
when implementation work otherwise succeeded.

Copy every criterion exactly from the selected step and keep its order. Return one result per criterion:

- `[x]` only with direct current evidence;
- `[ ]` when it failed, was skipped, is blocked, or lacks evidence.

Do not omit an unchecked criterion. Do not rely on a checked state from an earlier attempt after the related
implementation changed.

Use:

- `completed` when every criterion passes;
- `partial` when implementation changed and at least one criterion remains unverified or failed;
- `failed` when the step could not produce its intended implementation outcome.

## Report Format

```markdown
## Step Execution: <step ID, number, and title>

**Status:** completed | partial | failed **Attempt:** <number>

### Summary

<What was implemented, in plain language.>

### Files Changed

- Created: `path`
- Modified: `path`
- Deleted: `path`

Use `None` for an empty category.

### Commands and Checks

- `command` - passed
- `command` - failed: <short reason>
- File inspection - <what was verified>

### Success Criteria

- [x] <exact criterion text> - <evidence>
- [ ] <exact criterion text> - <failure, missing evidence, or blocker>

### Plan Validation

- [x] **AC-001:** <exact checklist item> - <evidence>
- [ ] **NFR-001:** <exact checklist item> - <failure, missing evidence, or blocker>

**Plan Status:** completed | incomplete

### Requirement Coverage

- FR-001: verified - <evidence>
- NFR-001: partial - <remaining validation>
- AC-001: pending - <remaining final validation>

### Blockers and Assumptions

- <blocker or assumption>

### Next Step

- `<step-id>` - Step <N>: <title>
```

Omit the Next Step section when there is no later step. Identify it for reference only.

Omit `Plan Validation` unless the caller indicates that all implementation steps will be completed by this execution.
Set plan status to `completed` only when every prerequisite is checked, every step has status `completed`, every step
criterion is checked, and every validation checklist item passes.

## Requirement Coverage

- Keep the requirement-to-step mapping unchanged during execution.
- Use `verified` only when all mapped work and requirement-level validation pass.
- Use `partial` when some valid implementation evidence exists but verification is incomplete.
- Use `pending` when changed or failed work leaves no sufficient evidence.

## Examples

Completed:

```markdown
**Status:** completed

- [x] PasswordHasher produces a non-plaintext hash - focused unit test passed.
- [x] Hashes verify against the source password - focused unit test passed.
```

Partial:

```markdown
**Status:** partial

- [x] Registration calls PasswordHasher - verified in `internal/auth/register.go`.
- [ ] Registration integration test passes - database test dependency is unavailable.
```

Failed:

```markdown
**Status:** failed

No implementation files changed. Step 1 dependency is absent, so the required interface cannot be used safely.
```

Never present a skipped test or inferred behavior as successful evidence. The calling workflow owns patch creation and
reports its status only after the executor returns.

## Plan Validation Rules

- Run every checklist item after the last incomplete implementation step becomes completed.
- Copy each checklist item exactly and preserve its order.
- Preserve every item's requirement or acceptance ID prefix.
- Prefer end-to-end and cross-step commands over repeating isolated checks.
- Evaluate each item from the final combined implementation; do not infer it from completed steps or their saved
  checkboxes.
- Mark `[x]` only from evidence produced or directly inspected against the final combined implementation.
- Leave blocked, failed, skipped, or unproven items `[ ]`.
- Do not modify implementation outside the selected step to make final validation pass. Report the affected step for a
  later execution or refinement.
