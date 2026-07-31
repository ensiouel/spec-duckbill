---
name: duckbill-spec-author
description: Initialize a minimal editable specification draft, develop a substantive draft into a ready technical specification, or restore only a developed specification's canonical plan link. Use for /duck-init, /duck-spec authoring, and specification-owned reciprocal-link recovery.
---

# Duckbill Spec Author

Follow only the caller-selected mode.

## Initialization

Resolve `scripts/init-spec.mjs` relative to this file and run:

```bash
node <skill-directory>/scripts/init-spec.mjs --repo <repository-root> --name "<complete name>"
```

Return JSON `path`. Pass the full name as one value. MUST NOT derive the path, write manually, overwrite, inspect the
project, or develop the draft.

## Authoring

Read [references/spec-format.md](references/spec-format.md) before development or metadata recovery.

1. If the developed specification lacks canonical `plan-file`, change only that field, verify all intent and other
   artifacts byte-for-byte unchanged, and return. Otherwise read the complete draft and user input.
2. Separate user facts, verified project facts, high-level design, implementation discretion, and material unknowns.
3. Inspect project files only when architecture/behavior/conventions affect specification facts.
4. Resolve material unknowns before the first edit; return them to the caller without asking directly.
5. Write the adaptive structure from `spec-format.md`. Preserve exact technical detail only when it is a required
   specification constraint or high-level design decision; return plan-only detail to the caller.
6. Preserve user intent/frontmatter. After readiness, remove draft guidance and `status`, add canonical future
   `plan-file`, and run the reference Quality Check.

## Boundaries

- MUST NOT invent requirements or project facts, replace user intent, or cross the reference content boundary.
- MUST NOT create/modify a plan, execution state, patch, or implementation code.
- Metadata recovery MUST preserve specification intent and the linked plan.

## Result

Return path, scope, resolved decisions, and requirements needing planning attention. Metadata recovery reports only the
restored link and preservation result.
