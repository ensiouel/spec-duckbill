---
description: Refine specification intent without changing its plan, state, or implementation
argument-hint: "<spec-file>[#L<line>[-<end>]] <feedback>"
---

Refine specification `$1` from feedback `${@:2}`.

Example: `/duck-refine-spec specs/user-auth.md#L35 Require one-time recovery links`

This command MAY change only the selected specification. It MUST preserve `plan-file`, linked plan intent,
`state.json`, and implementation code. Plan staleness is derived later from the specification hash.

Output MUST be exactly three lines, in order, with nothing else:

```text
Changed: <spec-file or none>
Status: <result and reason>
Next: <one exact Duckbill command or none>
```

## Isolation invariant

This command is the sole orchestrator. Load skills independently and never pass one skill's report to another.
Semantic workers read canonical artifacts plus resolved user input: original feedback and direct user answers, without
another skill's analysis. This command owns routing and user interaction.

## Flow

1. Missing reference or feedback: return `blocked; usage: /duck-refine-spec <spec-file> <feedback>` with no changes.
2. Resolve one repository-relative specification plus optional valid line fragment. A missing file, invalid range, or
   draft blocks without writes.
3. Require canonical `plan-file`; when the plan exists, require its reciprocal `spec-file`. Refinement never repairs
   metadata. Snapshot the linked plan and state bytes only to prove they remain unchanged; do not interpret state.
4. Load `duckbill-clarifier` independently only for a material specification unknown. Load `duckbill-spec-refiner`
   independently in preflight using only canonical artifacts and resolved user input. Continue only for a
   specification-level change. Plan changes, governed code defects, and material unknowns return to their owner without
   writes.
5. Authorize the specification worker to modify only the specification. Preserve stable requirement/decision IDs when
   meaning is unchanged and preserve `plan-file`.
6. Re-read the specification, run readiness checks, and verify linked plan, state, and implementation unchanged. A
   changed specification makes the linked state report `spec-changed` on its next read; do not persist that derived
   status.
7. A changed linked specification returns the exact plan-refinement command. Without a plan, route to plan creation.
   Unchanged intent returns `Next: none`. Recommendations never run automatically.
