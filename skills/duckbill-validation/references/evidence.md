# Evidence

A minimal evidence record is:

```json
{
  "result": "passed",
  "summary": "Focused check passed",
  "command": "npm test -- password",
  "exitCode": 0,
  "commit": "abc123",
  "dirtyTreeHash": "sha256:...",
  "observedPaths": ["src/auth/password.ts", "test/password.test.ts"],
  "observedPathHashes": {
    "src/auth/password.ts": "sha256:...",
    "test/password.test.ts": "sha256:..."
  },
  "outputDigest": "sha256:...",
  "specHash": "sha256:...",
  "planHash": "sha256:...",
  "tasksHash": "sha256:..."
}
```

Evidence records may add mapped IDs and task-definition hashes. They may not omit the repository and artifact binding shown above for a passed result.

Use the strongest focused proof that can reveal the claimed violation: direct file/symbol inspection for structure, a focused test for behavior, build/type checks for integration, a parser for configuration, and narrow integration tests for cross-component behavior. Writing code, a test name, prior output, or a successful unrelated command is not proof.

Negative, failure, security, and boundary requirements need evidence that exercises the protected edge. Record unavailable checks as blocked, never passed. Store only a digest plus a concise summary when full command output is large.

Task evidence is keyed by CHK ID. Feature evidence is keyed by VAL ID. The runtime persists and invalidates it; the validation skill only returns typed observations.

