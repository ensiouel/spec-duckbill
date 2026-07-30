# Step Design Guide

Read this reference when choosing, splitting, merging, or validating implementation steps.

## Choose Coherent Boundaries

A step is a meaningful implementation outcome, not a time estimate or a single edit. It may touch several files when
those changes must land together.

Prefer a boundary where:

- the project remains buildable when practical;
- a new behavior can be validated;
- breaking interface changes and their callers are updated together;
- the step has one clear reason to exist;
- later steps depend on an observable result.

Do not create separate steps for:

- one command without meaningful implementation work;
- verification already covered by the preceding step's criteria;
- mechanical documentation that belongs with an implementation change;
- each file in a single coherent feature;
- speculative edge cases unsupported by the specification.

## Size Guide

These are upper bounds, not targets.

| Task size  | Typical work                                               | Steps |
|------------|------------------------------------------------------------|-------|
| Trivial    | Configuration tweak, one-function fix                      | 1     |
| Small      | Local feature, endpoint, small refactor                    | 1-2   |
| Medium     | Module or multi-file feature using existing infrastructure | 2-4   |
| Large      | New subsystem or cross-layer change                        | 4-8   |
| Very large | Major service or multi-subsystem rewrite                   | 8-15  |

If more than fifteen useful steps are needed, split the work into related plans. When uncertain between two sizes, start
with the smaller one. A large step can later be refined; a plan full of microsteps is harder to understand and maintain.

## Good and Bad Splits

Bad:

```text
Step 1: Create PasswordHasher file
Step 2: Add hash method
Step 3: Add tests
Step 4: Connect it to registration
```

This separates one small behavior by file and activity.

Better:

```text
Step 1: Introduce and verify the password hashing service
Step 2: Integrate password hashing into registration
```

The first step produces a tested reusable capability. The second changes registration behavior and can depend on it.

Bad:

```text
Step 1: Change UserService.findById return type
Step 2: Fix broken callers
```

Step 1 deliberately leaves the build broken.

Better:

```text
Step 1: Change UserService.findById and update all current callers
```

An intermediate non-buildable state is acceptable only when an external operation such as code generation or a database
migration makes it unavoidable. State the reason and dependency explicitly.

## Dependency Check

- Reference only earlier stable step IDs.
- Use `none` when there is no dependency.
- Avoid cycles.
- Do not add a dependency merely because another step appears earlier.
- If two steps edit the same concern, merge them unless a real intermediate result separates them.

## Final Check

Before accepting the step structure, confirm:

- every step has a distinct outcome;
- no step exists only to make the plan look detailed;
- no breaking change is deferred to a later repair step;
- each criterion verifies the selected step rather than future work;
- step order follows actual dependencies.
