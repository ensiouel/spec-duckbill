# Hierarchy and Coverage

## Authority

Apply this strict order:

```text
.duckbill/constitution.md
  -> spec.md
  -> plan.md
  -> tasks.md
  -> application code
```

A lower level may add detail inside the freedom left by higher levels. It may not weaken, broaden, contradict, or silently reinterpret higher intent.

## Coverage chain

Trace every in-scope feature through:

```text
US -> FR/NFR/AC -> plan sections -> tasks -> CHK/VAL
```

Required deterministic coverage:

- every US is mapped by `plan.md` and at least one task;
- every FR, NFR, and AC is mapped by `plan.md` and at least one task;
- every FR, NFR, and AC is named by at least one `VAL` item;
- task mappings name only IDs from the current specification;
- dependencies name current task IDs, are not self-references, and form an acyclic graph;
- reciprocal frontmatter links and all feature IDs are canonical and equal.

Semantic analysis additionally checks that mappings are meaningful, not merely present. A task or validation item does not cover an ID when its outcome cannot reveal a violation of that ID.

## Conflict classes

- Constitution conflict: the specification or lower artifact violates a project principle.
- Specification conflict: plan, tasks, or code changes observable product intent.
- Plan conflict: tasks or code materially depart from the approved technical approach while still possibly satisfying the specification.
- Task conflict: implementation does not achieve the selected bounded outcome or its checks.
- Progress inconsistency: a task is marked completed although its required work or checks no longer match current artifacts.

For each finding, identify the highest level that must change. Do not recommend rewriting a higher level merely to describe lower-level drift.
