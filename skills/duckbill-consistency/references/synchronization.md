# Synchronization Preparation

`prepare-sync` compares the current ready specification with existing plan and tasks. It proposes downstream changes and does not write files.

## Required output

```json
{
  "status": "completed",
  "changedRequirementIds": ["FR-002"],
  "addedRequirementIds": [],
  "removedRequirementIds": [],
  "proposedPlanChanges": [],
  "proposedTaskChanges": [],
  "suggestedAffectedTaskIds": [],
  "requiredRemovalOrCorrection": [],
  "reason": "Downstream changes prepared"
}
```

Compare meaning, not only IDs. Treat changed requirements, acceptance criteria, scenarios, relevant plan constraints, actions, checks, mappings, and dependencies as impact sources.

For removed requirements, inspect supplied implementation facts. Do not simply delete a linked task when current code may retain the removed or now-forbidden behavior. Propose a removal task, correction task, and absence-focused validation when needed.

Preserve unaffected architecture, tasks, IDs, evidence eligibility, and ordering. Propose new IDs only for new meaning. The deterministic runtime independently computes affected tasks and transitive dependents after the artifacts are written. Agent suggestions only expand that set.

Do not derive new product intent from code drift. Drift may reveal a conflict, but only explicit specification refinement can change product intent.

