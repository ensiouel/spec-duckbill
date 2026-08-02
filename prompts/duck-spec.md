---
description: Develop an initialized draft or restore its canonical plan link without creating a plan or code
argument-hint: "<spec-file>"
---

Develop specification `$1`.

Example: `/duck-spec specs/user-authentication.md`

## Permissions

MAY change only the selected specification. MUST NOT create or change plan intent, state, implementation, tests, or
configuration.

## Clarification

If a material specification decision is missing, return only focused `[spec]` questions and stop before writes. Resume
after the answer; omit the terminal result while waiting.

## Flow

### 1. Resolve

Require one existing regular `specs/<name>.md` with no line fragment. Its canonical plan path is
`specs/plans/<name>/plan.md`. Invalid input is `blocked` with no changes.

### 2. Inspect

Read applicable project instructions and only context needed to verify specification facts.

- For a developed specification with a missing/wrong `plan-file`, use `duckbill-spec-author` metadata-recovery mode to
  restore only the canonical link. Verify all other artifacts unchanged; report `completed` and
  `/duck-plan <spec-file>`.
- For a developed specification with the canonical link, report `unchanged; specification is already developed` and the
  same `Next`.
- Otherwise, require `status: draft` and substantive input beyond `[WRITE HERE]`; missing input is `blocked`.

### 3. Clarify and author

Use `duckbill-clarifier` readiness mode with `specification` scope; after an answer, run answer-review before rechecking
readiness. Then use `duckbill-spec-author` authoring mode with the draft, verified facts, project instructions, and
resolved input.

### 4. Verify and report

Require the specification quality gate, stable requirement IDs, canonical `plan-file`, and unchanged plan, state,
implementation, tests, and configuration. Success is `completed; specification is ready` with
`Next: /duck-plan <spec-file>`. Every terminal `blocked` result leaves files unchanged.

## Terminal result

Never execute `Next`. On a terminal outcome output exactly:

```text
Changed: <none or sorted paths changed by this invocation>
Status: <completed|failed|blocked|unchanged>; <reason>
Next: <one exact Duckbill command or none>
```
