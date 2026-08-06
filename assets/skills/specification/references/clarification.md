# Specification Clarification

Clarify only a material product choice that the constitution, draft, project instructions, and verified facts cannot resolve. Product behavior, scope, public contracts, data lifecycle, security/privacy obligations, acceptance, and outcomes belong to specification.

Never ask for internal architecture, paths, symbols, libraries, algorithms, rollout, task decomposition, or proof approach. Those belong to plan.

Return 1-5 focused questions and make no writes:

```json
{
  "status": "needs_clarification",
  "owner": "specification",
  "questions": [
    {
      "id": "Q-001",
      "reason": "Why different answers materially change product intent",
      "question": "Concrete question text",
      "options": []
    }
  ]
}
```

Do not choose a default merely because it is common. On resume, use persisted answers and do not repeat answered questions.
