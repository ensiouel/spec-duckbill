---
description: Initialize an editable specification draft
argument-hint: "<specification name>"
---

Initialize a draft named `$ARGUMENTS`.

Example: `/duck-init User Authentication`

Output MUST be exactly three lines, in order, with nothing else:

```text
Changed: <created specification path or none>
Status: <result and reason>
Next: <one exact Duckbill command or none>
```

Flow:

1. Empty name: `Changed: none`; `Status: blocked; specification name is required`; `Next: none`.
2. Treat the full argument as a human-readable name, not a path or feature description.
3. Load `duckbill-spec-author` in initialization mode and use its script. Do not derive the path, write the draft
   manually, inspect the project, or develop the specification.
4. Verify that only the minimal draft was created; no plan, workflow state, or implementation may change.
5. A script failure returns `blocked` with no changes. After a verification failure, remove only this invocation's
   draft and verify removal. If cleanup is unsafe or fails, report the remaining path and return `failed`.
6. Success returns `Status: draft; replace the [WRITE HERE] line` and
   `Next: /duck-spec <created specification path>`.

Put recommendations only in `Next`; never run them automatically.
