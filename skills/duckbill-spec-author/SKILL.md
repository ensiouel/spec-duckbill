---
name: duckbill-spec-author
description: Internal Duckbill module; use only when an active Duckbill command selects specification initialization, authoring, or canonical plan-link recovery. Never use standalone or to modify a plan, workflow state, or implementation.
---

# Duckbill Spec Author

Create or recover one canonical specification in the mode selected by the active command.

## Required Reference

Read [references/spec-format.md](references/spec-format.md) before Authoring or Metadata recovery.

## Modes

- **Initialization:** create one untouched draft with the bundled script; do not inspect the project or develop it.
- **Metadata recovery:** restore only a developed specification's canonical `plan-file`; do not change intent.
- **Authoring:** develop one initialized draft after material readiness.

## Procedure

### Initialization

Resolve `scripts/init-spec.mjs` relative to this file and run:

```bash
node <skill-directory>/scripts/init-spec.mjs --repo <repository-root> --name "<complete name>"
```

Pass the full name as one value. Use the returned JSON `path`; MUST NOT derive the path, write manually, or overwrite.

### Metadata recovery

1. Require an existing developed specification whose expected canonical link is known.
2. Change only `plan-file`, verify specification intent and every other artifact byte-for-byte unchanged, and stop.

### Authoring

1. Read the complete draft, user input, and supplied project instructions.
2. Separate user facts, verified project facts, high-level design, implementation discretion, and material unknowns.
3. Inspect project files only when architecture, behavior, or conventions affect specification facts.
4. STOP before the first edit when a material unknown remains; do not ask the user directly.
5. Write the adaptive structure from the reference. Keep exact technical detail only when it is required specification
   intent; expose plan-only detail as `planningNotes` instead of saving it in the specification.
6. Preserve user intent and permitted frontmatter. Remove draft guidance and `status`, add canonical future
   `plan-file`, and run the reference Quality Check.

## Boundaries

- MUST NOT invent requirements or project facts, replace user intent, or cross the reference content boundary.
- MUST NOT create/modify a plan, workflow state, or implementation code, and MUST NOT read `state.json`.
- Metadata recovery MUST preserve specification intent and the linked plan.
- MUST NOT invoke another module, interact with the user, choose routing, or format a terminal result. The active
  command owns those concerns.

## Result

Produce a compact internal result with these labels:

- `outcome`: `initialized|authored|recovered|blocked`;
- `path`;
- `scope`: authored scope, or `none`;
- `changedRequirementIds`: created or changed `FR|NFR|AC` IDs, or `none`;
- `resolvedDecisions`: decisions incorporated into intent, or `none`;
- `planningNotes`: plan-owned details that remain relevant, or `none`;
- `materialUnknowns`: unresolved blockers, or `none`;
- `preservationVerified`: `true|false|not-applicable`.
