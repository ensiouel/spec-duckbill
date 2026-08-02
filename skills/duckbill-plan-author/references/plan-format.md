# Implementation Plan Format

The plan stores implementation intent. Plan-local `state.json` stores only progress and evidence.

## Template

```markdown
---
spec-file: specs/<name>.md
---

# Implementation Plan: <Name>

## Overview

<Implementation approach and result.>

## Goals

- <Implementation outcome>

## Scope

**In scope**

- <Included work>

**Out of scope**

- <Excluded work>

## Prerequisites

None.

## Implementation Steps

### Step 1: <Coherent outcome>

<Purpose.>

**ID:** <stable-kebab-id>

**Requirements:** FR-001, NFR-001, AC-001

**Context:**

- <Existing path, symbol, pattern, or specification section>

**Actions:**

1. <Concrete implementation action>

**Success Criteria:**

- **SC-001:** <Independently provable outcome>

**Dependencies:** none

## Validation Checklist

- **VAL-001:** <Cross-step or requirement-level check; explicitly names mapped FR/NFR/AC IDs>

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| <Risk> | <Prevention or detection> |

## References

- <Repository path or authoritative source>
```

Replace `None.` with `- **PRE-001:** <condition>` only when implementation has a real prerequisite.

## Stable identity

- Number `Step N` headings continuously by display order; heading numbers are not identity.
- Step IDs are stable kebab-case values.
- Present prerequisites use globally unique `PRE-###` IDs; use `None.` when there are no real prerequisites.
- Success Criteria use globally unique `SC-###` IDs across the whole plan.
- Final validation uses globally unique `VAL-###` IDs.
- Preserve an ID when meaning is unchanged. When meaning changes, retire the old ID and assign a new one.
- Retired definition IDs are never reused; gaps in `PRE-###`, `SC-###`, and `VAL-###` sequences are valid.
- Reordering does not change identity.

Stable IDs let state reference definitions directly. The state CLI never interprets meaning or uses prose as item
identity; its content hash ignores reciprocal workflow metadata and detects other document changes.

## Boundaries

The plan owns approach, scope, prerequisite definitions, steps, Context, Actions, Success Criteria, dependencies,
requirement mappings, validation definitions, and risks.

The plan MUST NOT contain checkboxes, status, Attempt, evidence, Execution sections, or current-step fields. The active
command creates `state.json` only after a new plan passes semantic and structural checks.

## Traceability

- Copy exact `FR`, `NFR`, and `AC` IDs from the specification; never invent or repurpose them.
- Map each in-scope requirement through a step `Requirements` field or a `VAL-###` item that explicitly names every
  mapped `FR`, `NFR`, or `AC` ID.
- Derive coverage when needed; do not persist a coverage table.

## Criteria quality

Criteria prove outcomes rather than implementation activity. Separate unrelated claims, and include negative or edge
evidence where a boundary requires it. Verify repository paths, symbols, commands, and dependencies instead of
guessing them.
