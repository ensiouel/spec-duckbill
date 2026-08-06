# Conflict Routing

Classify before writing and again before completion.

## Code versus specification

When code or requested feedback contradicts specification, do not complete the task and do not record passed evidence. Preserve specification. Route the user to explicit specification refinement or to a code correction that restores required behavior.

## Code versus plan

When code satisfies specification but materially departs from plan, block the task. The user must restore the planned approach or explicitly refine plan. Do not rewrite plan from actual code.

A local implementation detail is not a material plan deviation when plan deliberately leaves it open and it does not change boundaries, interfaces, data design, dependencies, rollout, security design, or test strategy.

## Proposed plan versus specification

Reject the complete plan/tasks proposal before writing when it weakens, broadens, or contradicts specification. The next action is revised plan feedback or explicit specification refinement.

## Ownership result

Return one of:

```text
implementation
plan
specification
material-unknown
```

Include related IDs, the current requirement/constraint, the conflicting proposal or code behavior, and why the difference is material. Never choose the user's intent from the current implementation.
