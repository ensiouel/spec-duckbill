---
description: Refine specification intent without changing its plan or implementation
argument-hint: "<spec-file>[#L<line>[-<end>]] <feedback>"
---

Refine specification `$1` from feedback `${@:2}`.

Example: `/duck-refine-spec specs/user-auth.md#L35 Require one-time recovery links`

This command MAY change only specification intent in the selected file. It MUST preserve `plan-file`, plan intent,
execution state, patches, and implementation code; it MUST NOT mark a step `stale` or synchronize a plan.

Output MUST be exactly three lines, in order, with nothing else:

```text
Changed: <spec-file or none>
Status: <result and reason>
Next: <one exact Duckbill command or none>
```

Flow:

1. Missing reference or feedback: return `blocked; usage: /duck-refine-spec <spec-file> <feedback>` with
   `Changed: none`, `Next: none`.
2. Parse one repository-relative specification plus optional exact `#L<line>` or `#L<start>-<end>`. Validate the range,
   read the complete file and referenced context. Invalid input returns `blocked` with no changes. A draft returns
   `blocked; specification draft is incomplete`, `Next: /duck-spec <spec-file>`.
3. Require canonical `plan-file`. Missing/wrong value returns `blocked; specification plan link is invalid`,
   `Next: /duck-spec <spec-file>`. If that plan exists, require its reciprocal `spec-file`; a bad backlink returns
   `blocked; linked plan backlink is invalid`, `Next: /duck-plan <spec-file>`. A nonexistent target means no plan.
   Refinement MUST NOT repair workflow metadata.
4. Record the specification, linked plan/state/patches, and implementation tree needed to verify the write boundary.
5. Load `duckbill-clarifier` and `duckbill-spec-refiner` in preflight mode. Finish classification, impact tracing,
   permission checks, and clarification before any write:

| Feedback | Action | Status | Next |
|---|---|---|---|
| specification-level change | continue | — | — |
| plan-level change, plan exists | STOP | `blocked; requested change belongs in the plan` | `/duck-refine-plan <plan-file> whole <normalized feedback>` |
| plan-level change, no plan | STOP | same | `/duck-plan <spec-file>` |
| code defect in one `completed` step | STOP | `blocked; requested change belongs in implementation code` | first earlier `/duck-execute`, otherwise `/duck-refine-code <plan-file> <step-id> <normalized feedback>` |
| material unknown or no unique completed owner | STOP | `blocked; material unknown: <concise clarification question>` | `none` |

   Earlier new, unexecuted, `partial`, `failed`, or `stale` work takes precedence over code repair. Resolve every
   specification-level unknown introduced by the feedback before continuing.
6. In refinement mode, modify only the specification. Preserve stable IDs for unchanged meaning and the valid
   `plan-file`. MUST NOT load or invoke `duckbill-plan-refiner`.
7. Re-read the result; require the specification final/readiness checks and identify exact changed requirement IDs.
   Verify linked plan, all execution state, patches, and implementation code byte-for-byte unchanged.
8. Select the result:

| Outcome | Status | Next |
|---|---|---|
| changed, linked plan | `ready; <requirement IDs> changed, linked plan requires synchronization` | `/duck-refine-plan <plan-file> whole Synchronize with the updated specification` |
| changed, no plan | `ready; <requirement IDs> changed` | `/duck-plan <spec-file>` |
| unchanged, linked plan unsynchronized | `unchanged; linked plan requires synchronization` | same exact `/duck-refine-plan` command |
| unchanged, synchronized/no plan | `unchanged; <reason>` | `none` |

Every STOP/blocked/routed result MUST use `Changed: none` and leave all files and execution state unchanged.
Recommendations belong only in `Next` and never run automatically.
