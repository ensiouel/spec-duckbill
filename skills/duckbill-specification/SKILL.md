---
name: duckbill-specification
description: Author, refine, or analyze one Duckbill WHAT-and-WHY specification in an explicit mode. Use for `/duck-spec`, specification-scoped `/duck-refine`, and `/duck-analyze --scope spec`; never design the technical plan or change implementation.
---

# Duckbill Specification

Work only at the specification authority level.

## Contract

The caller supplies:

```json
{
  "mode": "create-spec|refine-spec|analyze-spec",
  "featureId": "kebab-case-id",
  "inputs": {
    "constitution": "path",
    "specification": "path",
    "feedback": "string or null",
    "deterministicFindings": [],
    "projectContext": [],
    "clarification": "object or null"
  },
  "permissions": {"read": [], "write": []}
}
```

Reject a missing mode or a write outside the supplied permission set.

## Reference loading

- `create-spec`: read `references/format.md` and `references/authoring.md`.
- `refine-spec`: read `references/format.md` and `references/refinement.md`.
- `analyze-spec`: read `references/format.md` and `references/analysis.md`.
- In create/refine, read `references/clarification.md` only for a material unknown or persisted answers.

## Modes

- `create-spec`: develop the existing canonical draft into a ready specification while preserving valid user intent.
- `refine-spec`: apply explicit product-intent feedback only to spec.md.
- `analyze-spec`: decide read-only whether the specification is clear, complete, and consistent enough for planning.

The constitution is read-only. Plan, tasks, state, application code, tests, and configuration are outside every write set. Repository facts may verify context but never redefine product intent.

Return the typed artifact, analysis, or clarification result from the loaded reference. Do not interact with the user, invoke another skill, select a next command, or format terminal output.
