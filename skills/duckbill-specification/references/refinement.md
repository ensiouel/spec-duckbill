# Specification Refinement

Read the complete current specification and feedback. Classify the request by the highest authoritative layer whose
meaning it changes.

Specification owns changes to observable behavior, product scope, acceptance, external product contracts, mandatory
product constraints, WHAT, or WHY. If the feedback changes only HOW, task decomposition, or implementation inside
established design, stop without modifying `spec.md` and report the appropriate downstream owner.

When the feedback belongs to specification:

1. Apply it consistently across every affected part of `spec.md`.
2. Preserve unaffected product decisions.
3. Preserve stable `R` and `A` IDs while conceptual identity remains the same.
4. Re-evaluate readiness and keep the specification draft if a material product decision remains unresolved.
5. Record any such unresolved decision concisely in the relevant section before asking for clarification; it MUST NOT
   exist only in conversation history.

Specification refinement MUST NOT reconcile `plan.md`, `tasks.md`, or code. Report changed requirement and acceptance
IDs and explain the downstream planning impact. The next semantic step is planning reconciliation, not an automatic
downstream write.
