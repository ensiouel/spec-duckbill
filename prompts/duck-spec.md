---
description: Develop an initialized specification draft into a complete technical specification
argument-hint: "<spec-file>"
---

Develop this initialized specification:

- Specification: `$1`

Example: `/duck-spec specs/user-authentication.md`

Flow:

1. If the path is empty, show `Usage: /duck-spec <spec-file>` with the example above and stop.
2. Require a repository-relative path to an existing Markdown file and read it completely, including frontmatter and all
   user-added sections.
3. Require `status: draft`. When it is absent, stop and recommend `/duck-refine-spec` for an already developed
   specification.
4. Read the `## Description` section and other user notes. If the file contains no substantive input beyond the
   `[WRITE HERE]` placeholder, ask the user to complete it and stop.
5. Read applicable project instructions. Follow project-analysis scope and file references written by the user; inspect
   additional context only when necessary to avoid an unsupported project fact.
6. Load `duckbill-clarifier`. Identify material unknowns from the draft and inspected context, ask the user focused
   questions, and pause. Repeat after each answer until its readiness gate passes. Keep `status: draft`; a temporary
   `Open Questions` section is allowed while waiting.
7. Load and follow `duckbill-spec-author` using the draft and resolved answers as the source of truth and the same file
   as the target. If it returns a newly discovered material unknown, return to step 6.
8. Preserve valid user intent and user-owned frontmatter, remove initialization guidance and the temporary `status`
   field, and do not add frontmatter fields until a plan exists. Remove the frontmatter delimiters when no fields
   remain.
9. Re-read the saved specification. Require the spec author final check and the clarifier specification readiness gate
    to pass. If either fails because of a material unknown, restore `status: draft`, ask the user, and continue
    authoring after the answer. Otherwise report the exact format or verification failure.
10. End with exactly three concise lines:
    - `Changed: <changed paths or none>`
    - `Status: <ready or blocked, with a short reason>`
    - `Next: /duck-plan <specification path>` when ready, otherwise `Next: none` Add details only for unresolved
      questions, blockers, or verification failures. Do not create a plan.
