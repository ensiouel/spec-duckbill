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
3. Load `duckbill-spec-author` in initialization mode. MUST use its script; MUST NOT derive the path, write the file
   manually, inspect the project, or develop the specification.
4. Verify the draft contains only initialization metadata and input guidance. MUST NOT create a plan, workflow state,
   or implementation code.
5. Script failure before creation: return `blocked` with no changes. Verification failure after creation: remove only
   this invocation's draft and verify removal. If safe cleanup fails, report the remaining path in `Changed`, use
   `Status: failed; <reason>`, and `Next: none`.
6. Success:
   `Changed: <created specification path>`
   `Status: draft; replace the [WRITE HERE] line`
   `Next: /duck-spec <created specification path>`

Recommendations belong only in `Next` and never run automatically.
