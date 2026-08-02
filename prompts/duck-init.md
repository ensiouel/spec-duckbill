---
description: Initialize an editable specification draft
argument-hint: "<specification name>"
---

Initialize a specification draft named `$ARGUMENTS`.

Example: `/duck-init User Authentication`

## Permissions

MAY create one canonical `specs/<name>.md` draft. MUST NOT inspect or change plans, state, implementation, tests, or
configuration.

## Flow

### 1. Resolve

An empty name is `blocked; specification name is required`. Treat the complete argument as a human-readable name, not a
path or feature description.

### 2. Create

Use `duckbill-spec-author` in initialization mode and run its script. The script alone derives the slug and path; do not
write manually or develop the draft.

### 3. Verify and report

Require the reported canonical file to be the only created file and to contain the minimal draft marker. On verification
failure, remove only that draft; if safe cleanup fails, report its remaining path and `failed`.

Success is `completed; specification draft created; replace the [WRITE HERE] line` with
`Next: /duck-spec <created path>`.

## Terminal result

Never execute `Next`. On a terminal outcome output exactly:

```text
Changed: <none or sorted paths changed by this invocation>
Status: <completed|failed|blocked|unchanged>; <reason>
Next: <one exact Duckbill command or none>
```
