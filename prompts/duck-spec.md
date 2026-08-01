---
description: Develop an initialized draft or restore its canonical plan link without creating a plan or code
argument-hint: "<spec-file>"
---

Develop specification `$1`.

Example: `/duck-spec specs/user-authentication.md`

This command MAY change only the selected specification. It MUST NOT create plan intent, workflow state, tests, or
implementation code.

Skills are invoked independently by this command. Never pass a clarification report into another skill as context.
After clarification, the author receives canonical files plus resolved user input: the original request and direct
user answers, without another skill's analysis or report.

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
5. Before writing, read applicable project instructions and only project context needed to verify specification facts.
   Load `duckbill-clarifier`; ask only specification-level questions. Any material unknown MUST stop before writes with
   `Status: blocked; material unknown: <concise clarification question>` and `Next: none`.
6. Classify supplied technical detail by ownership. Keep it only when it is a required specification constraint or
   high-level design decision. Files, symbols, libraries, algorithms, Actions, and internal code structure that affect
   only implementation are plan intent and MUST NOT enter the specification.
7. Load `duckbill-spec-author` in authoring mode. Write specification intent, remove draft guidance and `status`, and set
   the canonical future `plan-file`. MUST NOT invoke `/duck-plan`.
8. Re-read the file; require the author quality and readiness checks, stable requirement IDs, and unchanged plan/code.
9. Success:

```text
Changed: <spec-file>
Status: ready; specification intent verified
Next: /duck-plan <spec-file>
```

Every blocked result MUST leave all files unchanged. Recommendations belong only in `Next` and never run automatically.
