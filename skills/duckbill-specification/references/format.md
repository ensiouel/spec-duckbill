# Specification Format

This reference is normative for `.duckbill/specs/<feature>/spec.md`.

## Common rules

- Feature IDs use lowercase kebab-case: `[a-z0-9]+(?:-[a-z0-9]+)*`.
- Frontmatter keys are scalar strings and appear once.
- Stable numeric IDs use exactly three digits and are never reused for different meaning.
- A retained meaning retains its ID.
- Ready specifications contain no `TODO`, `TBD`, `TK`, `[WRITE HERE]`, or angle-bracket template values.

## Frontmatter

```yaml
---
schema: duckbill/spec@1
feature-id: password-authentication
status: <draft or ready>
plan-file: .duckbill/specs/password-authentication/plan.md
---
```

`status` is explicitly `draft` or `ready`. Readiness is never inferred from a missing field. All links are canonical repository-relative `.duckbill/` paths.

`/duck-init` creates the canonical minimal draft. The user edits that ordinary project file. `/duck-spec` consumes the same file, replaces the draft with the ready structure below, and changes it to ready only after deterministic checks pass.

## Draft form

A draft contains exactly one level-two section:

```markdown
# <Feature name>

## Feature Brief

<User description of what should be built and why>
```

The Feature Brief is user input, not a partial ready specification. Actors, scenarios, requirements, IDs, acceptance criteria, and other normative sections are created by `/duck-spec`.

## Ready form

Ready specifications use the following required sections.

Use these level-two sections exactly once and in order:

```text
Overview
Actors
User Scenarios
Goals
Non-Goals
Requirements
External Contracts
Data Behavior
Security and Privacy Requirements
Acceptance Criteria
Product Outcomes
Assumptions
References
```

`Requirements` contains `### Functional Requirements` and `### Non-Functional Requirements`.

## IDs and scenarios

- scenario heading: `### US-###: <name>`;
- functional requirement: `- **FR-###:** <text>`;
- non-functional requirement: `- **NFR-###:** <text>`;
- acceptance criterion: `- **AC-###:** <text>`;
- product outcome: `- **OUT-###:** <text>`.

Each user scenario contains:

```markdown
**Priority:** P1
**Value:** <user or business value>
**Independent Test:** <observable test>
**Acceptance Scenarios:**

- <observable scenario>
```

## Content boundary

The specification owns WHAT and WHY: actors, observable behavior, constraints, external contracts, data behavior, security/privacy intent, acceptance, outcomes, assumptions, and exclusions.

It does not own internal architecture, components, repository paths, code symbols, discretionary libraries, algorithms, implementation actions, or competing unresolved alternatives.

Technical language is allowed only for observable product intent, a mandatory external contract, a mandatory compatibility constraint, or an explicit security/compliance requirement.
