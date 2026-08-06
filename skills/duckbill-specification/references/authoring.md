# Specification Authoring

Author from constitution to specification. Application code may verify facts but cannot define new product intent.

Start from the minimal editable draft created by `/duck-init`. Treat the text under `## Feature Brief` as the primary product input. Replace the minimal draft with the complete ready specification format; do not expect the user to pre-author its sections or IDs. Preserve any clear user intent and return specification-owned clarification when a material gap cannot be derived.

Write observable actors, scenarios, value, scope, behavior, contracts, data rules, security/privacy rules, acceptance, and outcomes. Preserve stable IDs whose meaning is unchanged. Assign a new ID when meaning changes. Remove resolved questions before `status: ready`.

Before returning ready, verify:

- every scenario is independently testable and includes value plus acceptance scenarios;
- every normative behavior has an FR or NFR ID;
- acceptance criteria are observable;
- goals, non-goals, requirements, outcomes, and contracts agree;
- no implementation design or unresolved placeholder remains;
- feature ID and canonical plan link are correct.

Return:

```json
{
  "status": "completed",
  "artifacts": {"specification": ".duckbill/specs/example/spec.md"},
  "reason": "Specification is ready"
}
```
