# Implementation Plan Format

Use for plan authoring and substantial plan refinement.

## Plan Template

Keep this order. Omit Risks or a reference category only when irrelevant.

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

- [ ] <Condition verified before implementation>

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

- [ ] <Independently provable outcome>

**Dependencies:** none

## Validation Checklist

- [ ] **AC-001:** <Cross-step or requirement-level check>

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| <Risk> | <Prevention or detection> |

## References

- <Repository path or authoritative source>
```

A new plan MUST NOT contain Project Context, Requirement Coverage, `Execution State`, per-step `Execution`, or a plan
`status` field. All checkboxes start unchecked.

## Ownership and Links

Plan intent owns implementation approach/scope, prerequisite text/order, step structure/order, Context, Actions,
Success Criteria text/order, dependencies, requirement mappings, validation definitions, and risks.

Execution state owns prerequisite/criterion/Validation checkmarks, per-step Execution `Status`, `Attempt`, `Files
Changed`, and global `Base Tree`, `Current Step`, `Attempt`, `Patch`, `Patch Status`. Code/tests/configuration are
separate implementation artifacts.

`spec-file` is immutable plan-level workflow metadata, not intent/state. It MUST identify one canonical existing
`specs/<name>.md` whose `plan-file` points back. `/duck-plan` alone may establish/restore `spec-file`; refinement MUST
preserve it and route invalid links before writes. Preserve other valid user frontmatter.

## Steps and Identity

Every step has a numbered heading, coherent outcome, unique stable kebab ID, `Requirements`, useful Context, ordered
Actions, independently provable criteria, and dependencies on earlier IDs or `none`.

- Use numbers only for display; IDs own commands, dependencies, mappings, Current Step, and execution records.
- Preserve an ID while its logical outcome is unchanged, including wording/order changes.
- Assign new IDs to new outcomes; retire an ID only when its outcome is removed, split, or merged away.
- Prefer buildable outcome boundaries and verified paths/symbols over snippets.
- Criteria MUST directly prove the step outcome. Separate unrelated claims; every clause needs evidence capable of
  revealing a violation. Boundary/protective behavior needs negative or edge evidence.

## Requirement Traceability

- Copy exact `FR`, `NFR`, `AC` IDs from the specification; MUST NOT invent or misattach IDs.
- Map each in-scope ID through a step `Requirements` field or an ID-prefixed final validation item.
- Derive coverage by scanning those mappings; MUST NOT persist a coverage table.

## Ordering and Routing

Execute strictly in plan order. The first step without `Execution Status: completed` or with an unchecked criterion is
the only executable step. New/unexecuted, `partial`, `failed`, and `stale` work routes to `/duck-execute`. A defect in a
`completed` step routes to `/duck-refine-code` only when governing intent is already correct.

Only `/duck-refine-plan` MAY set `stale`, when prior evidence no longer proves revised plan intent. Specification
refinement never changes plan state; later manual synchronization determines affected steps, resets obsolete evidence,
and marks only affected executed steps stale. MUST NOT add Execution merely to mark untouched work stale.

## Step Execution Record

After an attempt, append after Dependencies:

```markdown
**Execution:**

- Status: completed | partial | failed | stale
- Attempt: <positive integer>
- Files Changed: `path`, `path`
```

Persisted status means:

| Status | Meaning | Writer |
|---|---|---|
| `completed` | every criterion currently proven | execute/refine-code |
| `partial` | implementation changed; some criterion failed/unproven | execute/refine-code |
| `failed` | attempt produced no intended outcome | execute/refine-code |
| `stale` | plan refinement invalidated prior evidence | refine-plan only |

Untouched steps MUST NOT have Execution blocks.

## Lazy Execution State

The first `/duck-execute` inserts after Prerequisites:

```markdown
## Execution State

- Current Step: <step-id>
- Attempt: 1
- Base Tree: <git-tree-id>
- Patch: `specs/plans/<name>/steps/<step-id>.patch`
- Patch Status: building
```

The global Attempt MUST equal Current Step's per-step Attempt. On a normal attempt, start from that step's previous
Attempt or `0` and increment both once. A different current step receives a fresh Base Tree; a retry of the same current
step reuses its valid Base Tree.

Patch Status forms are exactly:

- `building`: attempt started, patch not finalized;
- `current`: Patch represents current attempt from Base Tree;
- `stale`: refine-plan changed Current Step intent while preserving Base Tree;
- `unavailable: <reason>`: patch build failed.

When a completed Current Step has `unavailable` plus valid Base Tree, `/duck-execute` MAY enter patch recovery: preserve
implementation, evidence, and Attempt; rebuild only that patch; do not increment Attempt.

`/duck-refine-code` MAY update execution state but MUST NOT change plan intent.

## Final Validation

Validation Checklist owns end-to-end, cross-step, or final-only requirement checks. Every item MUST start with exact
mapped IDs and name an executable/observable result. Run all items in the same `/duck-execute` invocation that completes
the last implementation step.

The plan is completed only when every prerequisite, step criterion, and validation item is checked and every step
status is `completed`. Leave failed/skipped/blocked/unproven items unchecked. Route a selected-step failure to
`/duck-execute`, another unique completed-step defect to `/duck-refine-code`, higher intent to its refiner, and an
unknown/external blocker to no command. Recommendations MUST be in `Next`, never hidden in `Status`.

Prerequisite text/order is plan intent; its checkmark is execution state.

## References and Commands

Use repository-relative paths and useful specification anchors. Verify existing paths, symbols, commands, and
dependencies; label future files. External sources belong in References only when they constrain implementation and
SHOULD be authoritative.
