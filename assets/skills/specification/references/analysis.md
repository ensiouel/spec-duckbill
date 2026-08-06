# Specification Analysis

Answer only whether the specification is clear, complete, and consistent enough for technical planning.

Inspect:

- missing actors, scenarios, value, independent tests, or acceptance scenarios;
- missing behavior, failures, acceptance, external contracts, data, security/privacy, outcomes, or exclusions;
- ambiguity, competing alternatives, and conflicting requirements;
- invalid internal references or constitution violations;
- unresolved placeholders;
- implementation design that belongs to plan;
- deterministic format and ID failures.

Do not design the plan or modify any file.

Return findings with severity `CRITICAL`, `HIGH`, `MEDIUM`, or `LOW`, an owner, related IDs, summary, and remediation. Any CRITICAL or HIGH finding makes the result blocked.

```json
{
  "status": "completed",
  "scope": "spec",
  "findings": [],
  "reason": "Specification is ready for planning"
}
```
