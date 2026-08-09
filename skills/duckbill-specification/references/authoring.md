# Specification Authoring

Read the complete draft, supplied product context, applicable project instructions, optional constitution, and relevant
authoritative references. Inspect repository facts when they clarify existing externally observable behavior or
compatibility, but do not derive new product intent from code.

Authoring develops an existing draft. If the current specification is already `ready`, stop without modifying it and
report specification refinement as the appropriate operation.

Develop the draft into a semantically sufficient specification using `assets/spec-ready.md` as a flexible starting
point. Preserve clear user intent. Consolidate overlapping statements instead of duplicating truth across goals,
scenarios, outcomes, and multiple requirement classes.

For each material product dimension, either define the behavior, establish that it is out of scope, or ask a focused
clarification when different answers would materially change the product. Do not guess a default merely because it is
common.

Mark `status: ready` only after the specification contract is satisfied. Otherwise, keep `status: draft`, make no
invented decision, record each material unresolved decision concisely in its relevant section, and report the focused
clarification that blocks readiness. A dedicated unresolved-decisions heading MAY be used when it materially improves
clarity, but it is not a required permanent section.

Before completion, check that:

- Intent, Scope, Behavior, Constraints, and Acceptance agree;
- every normative product behavior has an `R` ID;
- acceptance evidence is observable and meaningfully demonstrates the related behavior;
- important failures and boundaries are defined where relevant;
- no discretionary implementation design remains;
- no unresolved material product decision remains.
