# Specification Format

Read this reference whenever creating or substantially rewriting a specification.

## Complete Structure

Use this order. Omit an optional subsection only when it does not apply. Keep the main sections explicit so the document
remains predictable.

```markdown
---
plan-file: specs/plans/<name>/plan.md
---

# <Feature or Project Name>

## Overview

<What is being proposed, for whom, and why.>

## Background

<Relevant current behavior, motivation, and verified project context.>

## Goals

- <Observable outcome>

## Non-Goals

- <Related work intentionally excluded>

## Requirements

### Functional Requirements

- **FR-001:** <Required behavior, input, output, or failure behavior.>

### Non-Functional Requirements

- **NFR-001:** <Measurable quality, compatibility, accessibility, reliability, or operational constraint.>

## Technical Design

<A high-level design showing how the system is divided and how the required behavior flows through it. Include exact
implementation details only when explicitly supplied in the draft, refinement feedback, or a specification-scoped
clarification answer.>

### Application Architecture

<Important components, boundaries, responsibilities, and flow.>

### Configuration

<Runtime configuration and defaults when relevant.>

### Styling and Assets

<UI styling and asset decisions when relevant.>

### Operational Behavior

<Startup, shutdown, logging, failure, deployment, or maintenance behavior when relevant.>

## Data Models

<Entities, fields, lifecycle, ownership, or a clear statement that no persistent model is needed.>

## Interfaces

### <Interface Name>

<HTTP, command, event, file, or internal contract when relevant.>

## Security Considerations

<Authentication, authorization, secrets, sensitive data, escaping, abuse, and audit concerns.>

## Testing Strategy

- <How important behavior and constraints will be verified.>

## Acceptance Criteria

- **AC-001:** <Observable condition proving the feature is ready.>

## References

- <Repository path, user source, or authoritative external documentation.>
```

## Frontmatter

- An initialized draft contains only temporary `status: draft`.
- Remove `status` after the specification passes the clarification readiness gate. Remove the frontmatter delimiters
  when no fields remain.
- Add repository-relative `plan-file` only after that plan exists. Omit it before planning.
- Preserve additional valid user fields.
- Never duplicate `plan-file` in the Markdown References section.

## Section Rules

Always include:

- Overview
- Goals
- Non-Goals
- Requirements with Functional and Non-Functional subsections
- Technical Design
- Testing Strategy
- Acceptance Criteria
- References

Always include Technical Design. Keep it at the level of components, boundaries, responsibilities, data or request flow,
and operational behavior needed to explain how the requirements fit together. The author may derive this high-level
design from the requirements and verified project facts.

Include exact implementation details only when the user explicitly supplied them in the draft, refinement feedback, or a
specification-scoped clarification answer. Exact details include specific libraries, files, symbols, API methods,
wrapper layers, algorithms, and internal code structure. Do not infer or select such details merely from repository
conventions. Preserve explicitly supplied details.

Use Background, Data Models, Interfaces, and Security Considerations when relevant.

A short explicit “not applicable” statement is useful when absence is an important design fact, such as no persistence
or authentication.

An `Open Questions` section may be used temporarily while drafting. Resolve every in-scope question and remove the
section before completing the specification. Move intentionally deferred work to Non-Goals instead of leaving it
unresolved.

## Stable IDs

Write requirements as concise bullets with stable IDs:

- `FR-001`, `FR-002`, and so on for functional requirements;
- `NFR-001`, `NFR-002`, and so on for non-functional requirements;
- `AC-001`, `AC-002`, and so on for acceptance criteria.

Keep an ID when refining the same meaning. Assign a new ID for new meaning. Never reuse a removed ID for something
different.

Requirements describe observable behavior and constraints, not implementation tasks.

Every normative statement belongs under Requirements and receives a stable ID. A Technical Design, Data Models,
Interfaces, Security Considerations, or Operational Behavior section may explain or contextualize that requirement, but
MUST NOT be the only place that introduces mandatory or recommended behavior. Treat `MUST`, `SHOULD`, `MAY`, “must not”,
“should”, and equivalent wording as normative.

Good:

```markdown
- **FR-002:** The system MUST store only a one-way password hash and MUST reject registration without persisting the
  user when hashing fails.
```

Bad:

```markdown
- **FR-002:** Create `PasswordHasher`, call bcrypt, and update three source files.
```

Use these terms only when obligation benefits from being explicit:

- `MUST` means the requirement is mandatory.
- `SHOULD` means it is expected unless a documented reason justifies another choice.
- `MAY` means it is optional.

Do not force these terms into descriptive sections.

## Resolved Decisions

A completed specification must not present unresolved alternatives for required behavior or constraints.

Bad:

```markdown
The server reads posts on startup or uses a reload strategy chosen during planning.
```

If reloading changes observable behavior, clarify and record one required behavior. If the difference is
implementation-only, state the invariant requirement and omit the alternatives:

```markdown
The server MUST make valid posts from the configured content directory available through public routes.
```

The plan may then choose when and how to load them. The word “or” is allowed when the alternatives themselves are
intentional accepted behavior, such as accepting either of two documented input formats. It must not defer an undecided
requirement to planning.

## Quality Check

Before saving, confirm:

- every goal is supported by one or more requirements;
- every requirement is in scope, testable, and uniquely identified;
- every normative statement outside Requirements is represented by an `FR-` or `NFR-` ID;
- acceptance criteria prove the intended user or developer outcome;
- non-goals do not contradict requirements;
- technical design supports rather than expands required behavior;
- Technical Design is present and stays at a high level where exact implementation details were not explicitly supplied;
- every exact implementation detail in Technical Design is traceable to the draft, refinement feedback, or a
  specification-scoped clarification answer;
- no unresolved behavioral or constraint alternative is deferred to planning;
- interfaces, data, operations, security, and testing agree;
- no assumption hides an in-scope decision;
- no `Open Questions` section remains;
- repository facts and references were verified.
