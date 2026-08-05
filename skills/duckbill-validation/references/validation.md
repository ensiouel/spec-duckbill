# Validation

Validation asks whether current evidence proves that the current implementation satisfies approved requirements. It does not repair implementation or revise intent.

## validate-task

Evaluate the selected task's CHK items, mapped scenarios and requirements, relevant plan constraints, actual changed paths, focused command results, and repository snapshot. Return every CHK ID exactly once. A passed task requires direct current evidence for every check plus no specification or plan conflict.

## validate-feature

Require before semantic validation:

- specification status is ready;
- plan and tasks artifact hashes are current;
- deterministic analyze-all checks have no CRITICAL or HIGH result;
- every required non-retired task is completed;
- every required task evidence record is current;
- repository snapshot and observed paths satisfy evidence freshness rules.

Evaluate every VAL item against the implementation and its explicit US/FR/NFR/AC mappings. Return every VAL ID exactly once. Missing, stale, unavailable, or incapable proof cannot pass.

## Typed result

```json
{
  "status": "completed",
  "scope": "feature",
  "checks": [
    {
      "id": "VAL-001",
      "result": "passed",
      "summary": "Cross-task behavior passed",
      "command": "npm test",
      "exitCode": 0,
      "observedPaths": []
    }
  ],
  "reason": "Current evidence proves the feature"
}
```

The skill is code- and artifact-read-only. Only the runtime may write validation/evidence fields in state.

