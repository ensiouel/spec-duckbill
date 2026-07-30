# Implementation Plan Format

Read this reference whenever creating or substantially rewriting a plan.

## Required Structure

```markdown
---
spec-file: specs/<name>.md
---

# Implementation Plan: <Feature or Project Name>

## Overview

<Implementation approach and intended result in a short paragraph.>

## Goals

- <Primary implementation outcome>

## Scope

**In scope**

- <Included work>

**Out of scope**

- <Explicitly excluded work>

## Prerequisites

- [ ] <Condition that must be verified before implementation>

## Implementation Steps

### Step 1: <Coherent outcome>

<What this step accomplishes and why it is one unit of work.>

**ID:** coherent-outcome

**Requirements:** FR-001, NFR-001, AC-001

**Context:**

- See `path/to/existing-file`.
- See the governing specification section or verified project pattern.

**Actions:**

1. Modify specific files and describe the required behavior.
2. Follow an established project pattern when one exists.
3. Run the commands required by this step.

**Success Criteria:**

- [ ] <Observable file, API, behavior, test, build, or command result>
- [ ] <Another independently verifiable result>

**Dependencies:** none

## Validation Checklist

- [ ] **AC-001:** <End-to-end or cross-step validation>
- [ ] **NFR-001:** <Final validation for a requirement not owned by one step>

## Risks and Mitigations

| Risk            | Mitigation                                 |
|-----------------|--------------------------------------------|
| <Credible risk> | <How implementation reduces or detects it> |

## References

- Related implementation: `path/to/file`
- Authoritative documentation: <https://example.com/>
```

Keep the section order stable. Omit an empty reference category or a risk section only when it truly does not apply. Do
not add separate project-context, requirement-coverage, or execution-state sections to a newly authored plan.

## Verified Project Context

Analyze the project using [project-analysis.md](project-analysis.md), but place only useful results into the plan:

- summarize the implementation approach in Overview;
- put verified paths, symbols, patterns, and specification sections in each step's Context;
- put actual commands in Actions or Success Criteria;
- put required tools or environment conditions in Prerequisites;
- put uncertainty that has been resolved into the chosen actions;
- put remaining credible failure modes in Risks and Mitigations;
- put useful project and external sources in References.

Do not save material uncertainty as an assumption. Resolve it through inspection or user clarification before completing
the plan.

## Step Requirements

Each step must contain:

- one numbered `### Step N: Title` heading;
- a short coherent outcome;
- one unique stable kebab-case `ID`;
- governing `FR-`, `NFR-`, or `AC-` IDs;
- relevant context paths or specification sections;
- concrete ordered actions;
- independently verifiable success criteria;
- dependencies on earlier step IDs or `none`.

Prefer three to five success criteria when the work warrants them. Prefer verified file and symbol references over code
samples. Include exact code only when a contract would otherwise be ambiguous.

## Stable Step Identity

- Generate a unique kebab-case ID from the step outcome, such as `hash-password`.
- Use the number only for display order.
- Use step IDs in commands, Dependencies, Current Step, and execution records.
- Preserve the ID when wording or order changes but the logical outcome stays the same.
- Assign new IDs to new logical outcomes.
- Retire an old ID when its outcome is split, merged, or removed.

## Requirement Traceability

- Copy `FR-`, `NFR-`, and `AC-` IDs exactly from the specification.
- Map requirements directly through each step's `Requirements` field.
- Use the Validation Checklist for an `AC-` or requirement that needs only final cross-step verification. Start every
  item with one or more exact IDs, for example `**AC-001:**` or `**AC-001, NFR-002:**`.
- Derive coverage by scanning step mappings and validation evidence. Do not persist a separate Requirement Coverage
  table.
- Do not attach an ID to a step that does not implement or verify it.

## Success Criteria and Execution

Keep all criteria unchecked while authoring.

Make each criterion describe one independently provable outcome. A short conjunction is acceptable only when the
criterion names how every clause will be observed. Do not let a passing build, broad test suite, or test name stand in
for behavior it does not assert.

Choose evidence that directly observes the claimed behavior and could reveal its violation. For a boundary or protective
requirement, include an appropriate negative or edge scenario.

During execution, re-evaluate every selected-step criterion from current evidence. A step is completed only when its
execution record has `Status: completed` and all criteria are `[x]`.

Execute steps strictly in plan order. The first step without a `completed` Execution status or with an unchecked Success
Criterion is the only executable step. Never skip an incomplete, failed, partial, or stale earlier step.

Plan refinement sets an existing execution record to `Status: stale` when its evidence no longer proves the revised
step. Reset the affected criteria to `[ ]`. Do not create an Execution block only to mark an unexecuted step stale. The
next execution attempt replaces `stale` with its verified result.

After an execution attempt, add or replace this block after `Dependencies`:

```markdown
**Execution:**

- Status: completed | partial | failed | stale
- Attempt: <number>
- Files Changed: `path`, `path`
```

Do not add Execution blocks to untouched steps.

## Lazy Execution State

Do not include `Execution State` in a new plan. The first `/duck-execute` adds this section after Prerequisites:

```markdown
## Execution State

- Current Step: <step-id>
- Attempt: 1
- Base Tree: <git-tree-id>
- Patch: `specs/plans/<name>/steps/<step-id>.patch`
- Patch Status: building
```

Execution and refinement commands own this section after it exists.

## Final Validation

The Validation Checklist contains end-to-end, cross-step, or requirement-level checks not owned by one step.

- Make every item independently executable or observable.
- Start every item with the exact `FR-`, `NFR-`, or `AC-` IDs it validates.
- Name a verified project command or concrete expected result.
- Keep every item `[ ]` while authoring.
- Run the complete checklist automatically after the last incomplete step becomes completed.
- The plan is completed only when all prerequisites, all step criteria, and all validation items are `[x]`, and every
  step execution status is completed.
- Leave a failed, skipped, blocked, or unproven item `[ ]`.

## References and Commands

Use repository-relative paths and useful specification anchors. Label files that will be created. Do not invent existing
paths, symbols, commands, or dependencies.

External documentation belongs in References only when it directly constrains implementation. Prefer authoritative
sources.
