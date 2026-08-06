# Plan and Tasks Formats

This reference is normative for plan.md and tasks.md. All paths are canonical repository-relative `.duckbill/` paths.

## Common rules

- Feature and task IDs use lowercase kebab-case.
- Stable numeric IDs use exactly three digits and are never reused for different meaning.
- Ready artifacts contain no unresolved placeholders.
- Task execution status is stored as `pending` or `completed`. Attempts and runtime logs do not belong in artifacts.

## Technical plan

Path: `.duckbill/specs/<feature>/plan.md`.

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

The plan owns HOW: architecture, components, paths, symbols, libraries, algorithms, internal data representation, integrations, rollout, and testing approach. It cannot weaken or contradict specification.

`Requirement Mapping` uses one bullet for every current US, FR, NFR, and AC:

```markdown
- **US-001:** Architecture, Testing Strategy
- **FR-001:** Components and Boundaries
- **NFR-001:** Operational Behavior, Testing Strategy
- **AC-001:** Testing Strategy
```

Every target is an exact level-two plan section other than `Requirement Mapping` and `References`.

## Executable tasks

Path: `.duckbill/specs/<feature>/tasks.md`.

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
**Status:** pending
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

Use exact `None.` when there are no prerequisites. Every task contains every shown field. Dependencies name task IDs or exact `none`.

`Task N` is display numbering only. Kebab-case `ID` is stable identity. Status is `pending` or `completed`. PRE, CHK, and VAL IDs are unique within tasks.md. Every VAL has a non-empty mapping and check text.

A task is one coherent implementation outcome, not one file edit or command. Context contains verified facts. Actions describe bounded work. Checks independently prove the result.
