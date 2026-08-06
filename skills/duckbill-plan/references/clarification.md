# Plan Clarification

Clarify only a material plan-owned choice that specification, project instructions, and verified repository facts cannot resolve. Internal architecture, components, paths, symbols, libraries, algorithms, rollout, task decomposition, dependencies, and proof approach belong to plan.

If the unknown changes observable product behavior, return owner `specification` and make no writes. Otherwise return 1-5 focused plan questions:

```json
{
  "status": "needs_clarification",
  "owner": "plan",
  "questions": [
    {
      "id": "Q-001",
      "reason": "Why different answers materially change the plan",
      "question": "Concrete question text",
      "options": []
    }
  ]
}
```

On resume, use persisted answers and do not repeat answered questions.
