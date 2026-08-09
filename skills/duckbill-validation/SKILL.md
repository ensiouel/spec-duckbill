---
name: duckbill-validation
description: Validate a complete Duckbill feature against its current specification without repair. Use when inspecting requirements, acceptance, plan, tasks, source, tests, and current diagnostics; running safe verification; and classifying failures to specification, planning, or execution ownership.
---

# Duckbill Validation

## Ownership

Validation owns final feature acceptance. Its central question is: does the actual implementation satisfy the current
specification?

Validation MUST be read-only with respect to repository content. It MUST NOT repair findings, modify task status,
rewrite artifacts, or turn review into implementation. It MAY run relevant tests, linters, type checks, builds, and
read-only diagnostics, but MUST NOT knowingly invoke auto-fix or code-generation behavior that rewrites project sources
or Duckbill artifacts.

If `.duckbill/constitution.md` exists, read and respect it as Duckbill-specific project policy. Its absence MUST NOT
block work. Also respect normal Pi project instructions.

## Feature workspace

Resolve the selected feature under the repository root as `.duckbill/specs/<feature>/`, containing `spec.md`, `plan.md`,
and `tasks.md`. The feature identifier MUST be one nonempty lowercase kebab-case path segment. Resolved feature and
artifact paths MUST remain inside the repository-local `.duckbill/specs/` directory; stop on traversal, ambiguity, or
symlink escape.

All three artifacts MUST exist before validation. If one is missing, stop the operation without modifying anything and
report the verdict as `inconclusive`.

## Authority and classification

Inspect the complete specification, plan, tasks, relevant source, tests, and current verification results. The authority
order is specification → plan → tasks → code.

Classify material failures by the highest layer whose meaning is wrong:

- contradictory, incomplete, or materially undecided product truth → specification;
- implementation follows the plan but the plan does not satisfy the specification → planning;
- task decomposition, coverage, or dependency meaning does not represent the plan or specification → planning;
- specification and plan are sound but implementation is wrong or incomplete → execution;
- specification acceptance passes and the current plan remains sound, but implementation contradicts that plan →
  execution;
- implementation is current but a task completion state is wrong or stale → execution.

Validation MUST NOT change a higher layer merely to make current code pass.

Assess feature acceptance against the specification and repository conformance to the current authoritative plan as
distinct concerns. A material implementation contradiction with a current, sound plan is repository nonconformance and
MUST produce a `rejected` verdict even when specification acceptance passes. Validation MUST report both facts, assign
the defect to execution, and MUST NOT rewrite or reinterpret the plan to match the code.

## Procedure and result

Read [validation procedure](references/validation.md) and perform one complete feature validation.

Report operation status and acceptance verdict separately:

- **Operation:** `completed` when the review ran to a conclusion, including a negative one; `stopped` when validation
  could not be performed.
- **Verdict:** `accepted` when current evidence supports every material requirement and acceptance criterion and no
  material contradiction with a current, sound plan remains; `rejected` when current evidence demonstrates specification
  or repository nonconformance; `inconclusive` when missing or contradictory product truth, a missing required artifact,
  or unavailable material evidence prevents either conclusion.

Also report evidence for each material requirement and acceptance criterion, failed or unavailable checks, and the
semantic owner, reason, and needed change for every material finding. Planning or task-artifact findings MAY coexist
with an `accepted` implementation verdict when they do not undermine evidence of actual specification conformance. Do
not depend on or name slash commands; the command layer owns navigation.
