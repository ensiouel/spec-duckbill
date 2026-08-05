# Consistency Analysis

## Typed finding

```json
{
  "id": "F-001",
  "severity": "HIGH",
  "class": "specification_conflict",
  "owner": "specification",
  "artifacts": [".duckbill/specs/example/spec.md"],
  "relatedIds": ["FR-001"],
  "summary": "Concise inconsistency",
  "remediation": "Explicit owning operation"
}
```

Severity is one of `CRITICAL`, `HIGH`, `MEDIUM`, or `LOW`. CRITICAL means the hierarchy, safety boundary, or deterministic integrity is broken. HIGH means implementation or downstream intent cannot safely proceed. MEDIUM is a material quality or proof gap that should be corrected but does not necessarily invalidate all work. LOW is a precise improvement with limited impact. Any CRITICAL or HIGH finding makes the analysis result `blocked`.

## analyze-spec

Answer only whether specification is clear, complete, and consistent enough for planning. Inspect:

- missing actors, user scenarios, value, independent tests, or acceptance scenarios;
- missing behavior, failure behavior, acceptance, external contract, data, security/privacy, outcome, or explicit exclusion;
- ambiguity and competing alternatives;
- conflicting requirements or internal references;
- unresolved placeholders;
- internal implementation detail that belongs to plan;
- constitution violations;
- deterministic format or ID failures.

Do not design the plan in this mode.

## analyze-all

Check the constitution, specification, plan, tasks, state metadata, and available repository facts. Include:

- every analyze-spec concern;
- plan against specification and tasks against plan;
- semantic US/requirement/acceptance coverage;
- mapping meaning, NFR coverage, and validation strength;
- dependency correctness;
- artifact hash staleness and current operation consistency;
- evidence staleness reported by deterministic scripts;
- implementation conflicts that can be established from supplied code context.

Do not run broad validation as a substitute for consistency analysis. Analysis evaluates agreement and readiness. Validation evaluates current evidence.

## Typed result

```json
{
  "status": "completed",
  "scope": "all",
  "findings": [],
  "reason": "Artifacts are consistent"
}
```

The skill is read-only. It never writes a report file.

