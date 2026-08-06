# Specification Refinement

Apply feedback only when it changes or corrects product intent owned by the specification. Classify plan design and implementation defects without writing and return their actual owner.

Identify changed requirements, scenarios, contracts, acceptance criteria, outcomes, and exclusions. Update every affected section consistently. Preserve unrelated meaning and stable IDs. Give changed meaning a new ID when retaining the old ID would misrepresent mappings.

Do not update plan, tasks, or code in the same action. Report affected requirement and scenario IDs so `/duck:sync` can update downstream artifacts explicitly.

Return:

```json
{
  "status": "completed",
  "artifacts": {"specification": ".duckbill/specs/example/spec.md"},
  "affectedIds": ["FR-001"],
  "reason": "Specification feedback applied"
}
```
