---
name: duckbill-spec-refiner
description: Internal Duckbill module; use only when an active Duckbill command selects preflight or refinement of one ready specification from feedback. Never use standalone or to modify its plan, workflow state, or implementation.
---

# Duckbill Spec Refiner

Apply specification-level feedback consistently to one specification.

## Required Reference

Read [references/refinement-checklist.md](references/refinement-checklist.md) before impact tracing.

## Modes

- **Preflight:** perform procedure steps 1–3 without writes.
- **Refinement:** enter only after the active command establishes specification ownership, valid reciprocal links,
  permission, and material readiness; perform steps 4–5.

## Procedure

1. Apply the reference classification. Continue only for specification-level feedback.
2. Identify changed requirements/decisions and trace every affected section with the reference.
3. Inspect project files only to verify needed facts. STOP before edits when any material unknown remains.
4. Update all affected sections, preserve unrelated requirements and stable IDs for unchanged meaning, and add/update
   requirement IDs for normative content found outside Requirements.
5. Remove resolved temporary `Open Questions`; re-read and run the reference final check.

## Boundaries

- MAY modify only the selected specification and MUST preserve its canonical `plan-file`.
- MUST NOT read or change workflow state, plan intent, code, tests, or configuration.
- Invalid reciprocal links and non-specification feedback MUST STOP before all writes.
- MUST NOT invent product decisions or complete before material readiness.
- MUST NOT invoke another module, interact with the user, choose routing, or format a terminal result. The active
  command owns those concerns and any later plan synchronization.

## Phase Outputs

- Preflight: `classification` as `specification-level|plan-level|code-defect|material-unknown`.
- Refinement: none. The active command verifies and compares the resulting specification directly.
