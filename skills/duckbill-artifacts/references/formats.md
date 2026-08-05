# Artifact Formats

This reference is normative. All links are repository-relative canonical paths under `.duckbill/`.

## Common rules

- Feature IDs and task IDs use lowercase kebab-case: `[a-z0-9]+(?:-[a-z0-9]+)*`.
- Frontmatter keys are scalar strings and appear once.
- Stable numeric IDs use exactly three digits. IDs are never reused for different meaning.
- A retained meaning retains its ID. Display numbering is not identity.
- `spec.md`, `plan.md`, and `tasks.md` contain intent only. Attempts, evidence, execution status, and the current operation belong only in `state.json`.
- Ready artifacts contain no placeholders such as `TODO`, `TBD`, `TK`, `[WRITE HERE]`, or angle-bracket template values.
- Markdown checkboxes are forbidden in plan and tasks.

## Specification

Path: `.duckbill/specs/<feature>/spec.md`.

Frontmatter:

```yaml
---
schema: duckbill/spec@1
feature-id: password-authentication
status: draft
plan-file: .duckbill/specs/password-authentication/plan.md
---
```

`status` is explicitly `draft` or `ready`. Readiness is never inferred from a missing field.

Required level-two sections, in order:

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

Stable IDs:

- user scenario headings: `### US-###: <name>`;
- functional requirement bullets: `- **FR-###:** <text>`;
- non-functional requirement bullets: `- **NFR-###:** <text>`;
- acceptance bullets: `- **AC-###:** <text>`;
- product outcome bullets: `- **OUT-###:** <text>`.

Each user scenario has these exact fields inside its heading block:

```markdown
**Priority:** P1
**Value:** <user or business value>
**Independent Test:** <observable test>
**Acceptance Scenarios:**

- <observable scenario>
```

The specification owns WHAT and WHY: actors, observable behavior, constraints, external contracts, data behavior, security/privacy intent, acceptance, outcomes, assumptions, and exclusions. It does not own internal architecture, components, repository paths, code symbols, discretionary libraries, algorithms, implementation actions, or competing unresolved alternatives.

Technical language is allowed only when it is observable product intent, a mandatory external contract, a mandatory compatibility constraint, or an explicit security/compliance requirement. Put internal design in `plan.md`.

## Technical plan

Path: `.duckbill/specs/<feature>/plan.md`.

Frontmatter:

```yaml
---
schema: duckbill/plan@1
feature-id: password-authentication
status: ready
spec-file: .duckbill/specs/password-authentication/spec.md
tasks-file: .duckbill/specs/password-authentication/tasks.md
---
```

Required level-two sections, in order:

```text
Summary
Technical Context
Architecture
Components and Boundaries
Internal Data Design
Interfaces and Integration
Security Design
Operational Behavior
Testing Strategy
Rollout and Compatibility
Risks and Mitigations
Requirement Mapping
References
```

The plan owns HOW: architecture, internal components, repository paths, symbols, libraries, algorithms, internal data representation, integration design, rollout, and testing approach. It cannot weaken or contradict the specification.

`Requirement Mapping` uses one bullet per mapped ID:

```markdown
- **US-001:** Architecture, Testing Strategy
- **FR-001:** Components and Boundaries
- **NFR-001:** Operational Behavior, Testing Strategy
- **AC-001:** Testing Strategy
```

Every target is an exact level-two plan section name other than `Requirement Mapping` or `References`. Every in-scope `US`, `FR`, `NFR`, and `AC` ID is mapped. Unknown IDs and unknown sections are invalid.

The plan never contains task execution status, checkboxes, attempts, evidence, a current task, or completed state.

## Executable tasks

Path: `.duckbill/specs/<feature>/tasks.md`.

Frontmatter:

```yaml
---
schema: duckbill/tasks@1
feature-id: password-authentication
spec-file: .duckbill/specs/password-authentication/spec.md
plan-file: .duckbill/specs/password-authentication/plan.md
---
```

Required structure:

```markdown
# Tasks: <Feature name>

## Prerequisites

- **PRE-001:** <condition and verification method>

## Tasks

### Task 1: <coherent implementation outcome>

**ID:** <stable-kebab-id>
**User Scenarios:** US-001
**Requirements:** FR-001, NFR-001, AC-001
**Dependencies:** none
**Context:**
- <verified fact or plan section>
**Actions:**
1. <concrete action>
**Checks:**
- **CHK-001:** <independently verifiable result>

## Feature Validation

- **VAL-001:** [US-001, FR-001, NFR-001, AC-001] <cross-task check>
```

Use exact `None.` instead of prerequisite bullets when there are no prerequisites. A task must contain every shown field. Comma-separated mappings contain at least one ID. `Dependencies` contains task IDs or exact `none`.

`Task N` is a continuous display number only. The kebab-case `ID` is stable identity. `PRE-###`, `CHK-###`, and `VAL-###` are globally unique within tasks.md. Each VAL bullet has a non-empty bracketed mapping and text after it.

A task is one coherent implementation outcome, not one file edit or command. Context states verified paths, symbols, patterns, or plan sections. Actions describe bounded work. Checks prove the result independently. Tests and related code normally belong to the same outcome.

Tasks never contain status, checkboxes, attempts, evidence, or a current operation.

## State

Path: `.duckbill/specs/<feature>/state.json`. It stores execution metadata only and is not an intent source.

Minimum shape:

```json
{
  "schema": "duckbill/state@1",
  "revision": 1,
  "featureId": "password-authentication",
  "artifacts": {
    "specHash": null,
    "planHash": null,
    "tasksHash": null,
    "planStatus": "missing",
    "tasksStatus": "missing"
  },
  "repository": {"commit": null, "dirtyTreeHash": "sha256:..."},
  "currentOperation": null,
  "pendingClarification": null,
  "prerequisites": {},
  "tasks": {},
  "validation": {"status": "pending", "evidence": {}, "staleReasons": []}
}
```

Task status is `pending`, `running`, `partial`, `failed`, `blocked`, `completed`, or `stale`. A running execute/repair operation stores task ID, command, feedback and references, plus starting artifact and repository hashes. Task records store attempt history, current evidence, staleness reasons, and retirement metadata. Every write uses `expected revision`, increments revision once, validates the complete schema, and is atomic. `scripts/state.mjs` is the executable authority for exact fields and transitions.
