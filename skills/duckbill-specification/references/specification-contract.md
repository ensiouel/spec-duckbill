# Specification Contract

## Readiness and format

The readiness test is:

> Planning can continue without inventing material product decisions.

A ready specification MUST satisfy that test and MUST NOT contain unresolved material product decisions, placeholders,
or competing alternatives.

A draft MUST preserve any known material unresolved decision in the relevant section so another operation can recover it
without conversation history. A temporary dedicated section MAY be used when clearer, but `Open Questions` is not a
mandatory heading.

Use only minimal frontmatter:

```yaml
---
status: draft
---
```

or:

```yaml
---
status: ready
---
```

Schema versions, duplicated feature IDs, reciprocal file links, timestamps, and workflow state MUST NOT be added without
a concrete semantic need.

## Content

A ready specification SHOULD normally contain:

- **Intent:** what is being built and why it exists.
- **Scope:** relevant product boundaries, usually in scope and out of scope.
- **Behavior:** normative product requirements.
- **Constraints:** only mandatory product-level or externally imposed constraints, when relevant.
- **Acceptance:** observable evidence of completion.
- **References:** authoritative inputs, when relevant.

Optional concepts MUST NOT become empty mandatory headings. Omit Constraints or References when they add no material
information. Add focused structure only when the feature needs it.

Specification MUST NOT choose discretionary architecture, components, persistence, libraries, internal data
representation, repository paths, symbols, algorithms, or task decomposition. A technical term MAY appear when it
expresses observable behavior, an external contract, compatibility, security, privacy, compliance, or another mandatory
product constraint.

Before readiness, consider materially relevant happy paths, failures, edge cases, permissions, security and privacy
behavior, data behavior, external contracts, and compatibility constraints. Do not add dedicated sections for irrelevant
dimensions.

## Stable identifiers

Behavior requirements use `R1`, `R2`, and so on. Acceptance criteria use `A1`, `A2`, and so on. Do not create separate
functional, quality, scenario, outcome, check, or validation namespaces.

A requirement answers: “What must be true?” Acceptance answers: “How can completion be demonstrated?” They MUST remain
distinct without needless duplication.

An identifier SHOULD remain stable while the conceptual entity remains the same. Clarification alone SHOULD NOT create a
new ID. Create a new ID when a new requirement appears, one requirement splits into independently meaningful
requirements, or a requirement is conceptually replaced.
