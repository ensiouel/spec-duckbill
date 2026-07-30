---
description: Initialize an editable specification draft
argument-hint: "<specification name>"
---

Initialize a specification draft named:

$ARGUMENTS

Example: `/duck-init User Authentication`

Flow:

1. If the name is empty, show `Usage: /duck-init <specification name>` with the example above and stop.
2. Treat the complete argument as the human-readable specification name, not as a feature description or path.
3. Load and follow `duckbill-spec-author` in initialization mode. Create the draft through its bundled script; do not
   derive the path, write the file manually, inspect the project, or develop the specification.
4. If the script fails, show its exact error and stop without reporting a changed file.
5. End with exactly three concise lines:
    - `Changed: <created specification path>`
    - `Status: draft; replace the [WRITE HERE] line`
    - `Next: /duck-spec <created specification path>`
