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

## Complete analysis

Check the constitution, specification, plan, tasks, implementation, and available repository facts. Include:

- specification completeness, ambiguity, conflicts, placeholders, misplaced implementation detail, and constitution agreement;
- plan against specification and tasks against plan;
- semantic US/requirement/acceptance coverage;
- mapping meaning, NFR coverage, and validation strength;
- dependency correctness;
- artifact hash staleness and current operation consistency;
- completed task claims that no longer match current artifacts or code;
- implementation conflicts that can be established from supplied code context.

Do not run broad validation as a substitute for consistency analysis. Analysis evaluates agreement and readiness. Validation evaluates current behavior.

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
