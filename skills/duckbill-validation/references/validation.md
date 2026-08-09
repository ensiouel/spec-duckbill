# Feature Validation

Read all current feature artifacts and inspect the implementation areas they identify. Follow additional relevant code
paths when needed to establish actual behavior. A completed task label or prior report is context, not proof.

Build an evidence-based view of each current `R` requirement and `A` acceptance criterion. Use existing tests and
verification commands where appropriate. Add focused read-only diagnostics when safe. Prefer current results; report a
check as unavailable when it cannot be run or observed responsibly.

For each material item, report one of:

- **passed:** current observable evidence supports it;
- **failed:** current evidence demonstrates a violation or missing behavior;
- **unavailable:** evidence could not be obtained, with the reason and impact.

Inspect whether plan and task claims explain the implementation, but judge final acceptance against the specification.
Classify every material failure using the ownership contract in `SKILL.md`.

Report specification acceptance and conformance to the current authoritative plan separately. If the specification is
sound, the plan remains current and sound, and code satisfies specification acceptance but contradicts the plan, report
specification acceptance as passed and plan conformance as failed. Classify the contradiction as an execution-owned
implementation defect and use a `rejected` feature verdict. Validation MUST NOT rewrite the plan to match the code.

Validation MUST NOT fix code, rewrite artifacts, change task status, or invent missing decisions. End with separate
operation status and feature verdict using the definitions in `SKILL.md`, then give the immediate semantic owner for
follow-up when one exists.
