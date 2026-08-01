---
name: duckbill-spec-refiner
description: Refine specification intent from feedback without changing its plan or code. Use for requirement, scope, constraint, contract, data, security, acceptance, or high-level design changes after a specification is ready.
---

# Duckbill Spec Refiner

Apply specification-level feedback consistently to one specification.

## Required Reference

Read [references/refinement-checklist.md](references/refinement-checklist.md) before impact tracing.

## Modes

- **Preflight:** classify, trace impact, inspect facts, and detect unknowns without writes.
- **Refinement:** enter only after the caller confirms specification ownership, valid reciprocal links, permissions,
  and clarification readiness.

## Procedure

1. Classify feedback as specification-level, plan-level, code defect, or material unknown. Continue only for the first.
2. Identify changed requirements/decisions and trace every affected section with the reference.
3. Inspect project files only to verify needed facts. Return every material unknown to the caller before edits; MUST
   NOT ask the user directly.
4. Update all affected sections, preserve unrelated requirements and stable IDs for unchanged meaning, and add/update
   requirement IDs for normative content found outside Requirements.
5. Remove resolved temporary `Open Questions`; re-read and run the reference final check.

## Boundaries

- MAY modify only the selected specification and MUST preserve its canonical `plan-file`.
- MUST NOT read or change workflow state, plan intent, code, tests, or configuration. Synchronization is derived
  outside this worker.
- Invalid reciprocal links and non-specification feedback MUST STOP before all writes and return to the caller.
- MUST NOT invent product decisions or complete before clarification readiness.
- MUST NOT invoke another worker or choose a follow-up command.

## Result

Return changed requirement IDs/sections, scope changes, resolved decisions, and consequences for later manual plan
synchronization. The caller owns the strict footer and `Next`.
