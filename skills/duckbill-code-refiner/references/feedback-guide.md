# Code Feedback Guide

Read this reference before correcting code from feedback.

## Interpret Feedback

Translate feedback into:

1. the observed problem;
2. the expected behavior already required by the plan;
3. the affected implementation area;
4. the evidence that will prove the correction.

If item 2 is not present in the plan or specification, this is a plan change rather than code-only refinement.

## Local References

Feedback may contain:

```text
internal/auth/password.go
internal/auth/password.go#L42
internal/auth/password.go#L42-58
specs/plans/user-auth/steps/hash-password.patch#L120
```

Read every referenced range with enough surrounding context. A reference identifies evidence or context; it does not
authorize unrelated edits.

Patch lines describe the complete current result of the selected step from its baseline. Source-file lines describe
current working-tree content. When they appear to disagree, inspect both the working tree and patch before editing.

## Scope Decisions

Code-only refinement is appropriate:

```text
internal/auth/password.go#L42 Preserve the original error as the cause.
```

Plan refinement is required:

```text
Replace password authentication with passkeys.
```

Combined plan and code refinement may be appropriate:

```text
Split hashing from registration and move it to a reusable service.
```

## Validation

- Re-run checks related to changed behavior.
- Return every selected-step criterion in its exact wording and order.
- Mark a criterion `[x]` only when current direct evidence proves every claim. Otherwise return `[ ]` with the failure
  or missing evidence.
- Use `completed` only when every criterion passes, `partial` when implementation changed but a criterion remains
  unproven, and `failed` when the intended correction could not be produced.
- When the correction would complete every implementation step, validate every final plan checklist item against the
  combined implementation and report its exact wording, order, checkbox, and evidence separately.
- Inspect the final code diff. The calling workflow inspects the regenerated patch after the refiner returns.
- Confirm no specification or plan intent changed.
- Report any check that could not run.
