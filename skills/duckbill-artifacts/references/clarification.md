# Clarification Protocol

Clarify only material choices that available artifacts, project instructions, or verified repository facts cannot resolve. A choice is material when different answers change specification intent or technical plan intent.

Ownership:

- `specification`: product behavior, scope, public/external contract, data lifecycle, security/privacy obligation, acceptance, or outcome;
- `plan`: internal architecture, components, paths, symbols, libraries, algorithms, rollout, task decomposition, dependencies, or proof approach.

Never ask specification work to decide plan-owned details. Implementation may choose a local detail when the current plan leaves it discretionary and every higher-level constraint is preserved.

Return one focused batch with stable question IDs:

```json
{
  "status": "needs_clarification",
  "owner": "specification",
  "questions": [
    {
      "id": "Q-001",
      "reason": "Why different answers materially change intent",
      "question": "Concrete question text",
      "options": []
    }
  ]
}
```

Use 1-5 questions. Put the blocking question first. Options are concise materially different choices; omit options when a short free answer is needed. Do not choose a default merely because it is common.

The runtime persists owner, questions, source command, skill mode, command arguments, and accumulated answers. On resume, use that persisted context rather than conversation memory. Do not repeat answered questions. A semantic skill never asks the user directly and never writes state.

