# Specification Format

Use for specification authoring or substantial specification refinement.

## Document Template

Keep this order. Omit optional sections when irrelevant.

```markdown
---
plan-file: specs/plans/<name>/plan.md
---

# <Name>

## Overview

<Proposal, audience, reason.>

## Background

<Relevant verified context.> <!-- optional -->

## Goals

- <Observable outcome>

## Non-Goals

- <Excluded related work>

## Requirements

### Functional Requirements

- **FR-001:** <Required behavior or failure behavior.>

### Non-Functional Requirements

- **NFR-001:** <Measurable constraint.>

## Technical Design

<High-level components, boundaries, responsibilities, and flow.>

## Data Models

<Data lifecycle and ownership.> <!-- optional -->

## Interfaces

### <Interface>

<Contract.> <!-- optional -->

## Security Considerations

<Security boundaries.> <!-- optional -->

## Testing Strategy

- <How behavior and constraints will be verified.>

## Acceptance Criteria

- **AC-001:** <Observable completion condition.>

## References

- <Repository or authoritative source.>
```

Required sections: Overview, Goals, Non-Goals, Requirements with both subsections, Technical Design, Testing Strategy,
Acceptance Criteria, References. Use Background, Data Models, Interfaces, Security, Configuration, Styling/Assets, or
Operational Behavior only when relevant. A short “not applicable” is useful when absence is an important fact.

## Frontmatter

- An initialized draft has only `status: draft` plus preserved user fields.
- After readiness, remove `status` and add canonical repository-relative
  `plan-file: specs/plans/<name>/plan.md`; the plan need not exist.
- `/duck-refine-spec` MUST preserve `plan-file`. Invalid specification metadata routes to `/duck-spec`; an invalid
  linked plan backlink routes to `/duck-plan`. Refiners MUST NOT repair links.
- MUST NOT duplicate `plan-file` in References.

## Intent Boundary

Specification intent owns scope, required behavior/constraints, contracts/interfaces, data behavior, security,
acceptance, and high-level design. It MUST NOT contain plan Actions, Success Criteria, dependencies, mappings,
execution state, patches, or code.

Technical Design is always present and explains components, boundaries, responsibilities, and flow. A supplied exact
technical detail belongs here only when user intent makes it a required compatibility, security, operational, contract,
or high-level design constraint. Files, symbols, API methods, wrapper layers, algorithms, discretionary libraries, and
internal code structure are plan intent. Clarify ambiguous ownership before writes.

A specification change MUST NOT edit/synchronize a linked plan or mark steps `stale`; report changed requirement IDs
for later manual `/duck-refine-plan`.

## Stable Normative IDs

- Use unique `FR-###`, `NFR-###`, and `AC-###` IDs.
- Preserve an ID when meaning is unchanged; assign a new ID to new meaning; never reuse a removed ID.
- Requirements describe observable behavior/constraints, not implementation tasks.
- Every normative behavior or constraint MUST appear under Requirements with an ID. Other sections MAY explain it but
  MUST NOT be its only source.
- Use `MUST`, `SHOULD`, and `MAY` only when obligation benefits from being explicit.

Good: `FR-002: The system MUST reject registration without persisting the user when hashing fails.`

Bad: `FR-002: Create PasswordHasher, call bcrypt, and update three files.`

## Resolved Decisions

A ready specification MUST NOT defer unresolved required behavior or constraints as alternatives. If alternatives
change observable intent, clarify and choose. If they are implementation-only, state the invariant and omit them.
Intentional accepted alternatives (for example, two supported input formats) are allowed.

Temporary `Open Questions` MAY exist while drafting, but MUST be resolved and removed before readiness. Move deferred
product scope to Non-Goals.

## Quality Check

- Goals are covered by in-scope, testable, unique requirements; acceptance criteria prove the intended outcome.
- Non-goals, requirements, design, interfaces, data, operations, security, testing, and references agree.
- Every normative statement maps to an `FR`/`NFR`; stable IDs and user intent are preserved.
- Technical Design supports but does not expand requirements and contains no discretionary plan detail.
- No material decision is hidden in assumptions, alternatives, or Open Questions.
- Repository facts/references are verified.
- No plan intent, execution state, patch, or implementation code was introduced.
