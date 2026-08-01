---
description: Develop an initialized draft or restore its canonical plan link without creating a plan or code
argument-hint: "<spec-file>"
---

Develop specification `$1`.

Example: `/duck-spec specs/user-authentication.md`

This command MAY change only the selected specification. It MUST NOT create plan intent, workflow state, tests, or
implementation code.

This command is the sole orchestrator. Load skills independently. Give the author only canonical files and resolved
user input—the original request plus direct user answers—never another skill's report.

Output MUST be exactly three lines, in order, with nothing else:

```text
Changed: <changed file or none>
Status: <result and reason>
Next: <one exact Duckbill command or none>
```

Flow:

1. Empty path: return `blocked; usage: /duck-spec <spec-file>` with `Changed: none` and `Next: none`.
2. Require one existing repository-relative Markdown file; otherwise return `blocked` with no changes. Derive
   `specs/plans/<name>/plan.md` from its filename.
3. For an already-developed specification:
   - missing or wrong `plan-file`: metadata-recovery mode MUST change only that field to the canonical path, verify all
     other artifacts unchanged, and return `completed; canonical plan link restored`;
   - canonical `plan-file`: return `unchanged; specification is already developed`.
   In both cases use `Next: /duck-plan <spec-file>`; `/duck-plan` owns existing-plan routing. Do not author further.
4. Otherwise require `status: draft` and substantive input beyond `[WRITE HERE]`. Missing input returns
   `blocked; substantive specification input is required`, `Changed: none`, `Next: none`.
5. Read applicable project instructions and only the context needed to verify specification facts. Load
   `duckbill-clarifier` for specification readiness. A material unknown blocks before writes and returns its concise
   question with `Next: none`.
6. Load `duckbill-spec-author` in authoring mode with canonical artifacts and resolved user input. Author the
   specification in place; do not invoke `/duck-plan`.
7. Re-read the specification and require the author quality/readiness checks, stable requirement IDs, canonical
   `plan-file`, and unchanged plan and code.
8. Success returns `Status: ready; specification intent verified` and `Next: /duck-plan <spec-file>`.

Every blocked result leaves all files unchanged. Put recommendations only in `Next`; never run them automatically.
