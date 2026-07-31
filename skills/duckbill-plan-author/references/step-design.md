# Step Design Guide

## Coherent Boundaries

A step is one meaningful implementation outcome, not one file, activity, or time estimate. Prefer a boundary that is
buildable when practical, independently testable, has one reason to exist, updates breaking interfaces with callers,
and gives later steps an observable dependency.

MUST NOT create separate steps for a command, tests/docs belonging to an implementation change, each file in one
feature, or speculative behavior absent from the specification.

Typical upper bounds (not targets): trivial 1; small 1–2; medium 2–4; large 4–8; very large 8–15. More than 15 coherent
steps usually needs multiple related plans. Prefer the smaller viable split.

Boundary example:

```text
Good: Introduce and verify the password hashing service
      Integrate it into registration (depends on the first step)

Bad:  Create file → add method → add tests → connect registration
```

The bad split separates one capability by file/activity. Likewise, update a breaking interface and all current callers
in one step unless an unavoidable external operation requires an explicit non-buildable boundary.

## Dependencies

- Reference only earlier stable step IDs; use `none` when absent.
- MUST NOT create cycles or dependencies based only on display order.
- Merge steps that repeatedly edit one concern unless a real intermediate outcome separates them.

## Final Check

Every step MUST have a distinct outcome; no step exists for cosmetic detail; no breaking change is deferred to repair;
criteria verify this step rather than future work; and order follows actual dependencies.
