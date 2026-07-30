# Specification Refinement Checklist

Read this reference before applying specification feedback.

## Trace the Change

Translate feedback into one or more semantic changes:

- add, remove, or alter behavior;
- change scope or a non-goal;
- add or change a constraint;
- revise a design decision or interface;
- correct an assumption or project fact;
- change validation expectations.

Then inspect every affected section:

| Changed item           | Also inspect                                    |
|------------------------|-------------------------------------------------|
| Goal or non-goal       | Requirements, scope, testing                    |
| Functional requirement | Design, interfaces, data, security, testing     |
| Constraint             | Design, risks, testing                          |
| Data lifecycle         | Interfaces, security, failure behavior, testing |
| Interface              | Requirements, compatibility, errors, testing    |
| Security rule          | Requirements, design, data, testing             |

## Preserve Specification Integrity

- Preserve stable IDs for unchanged requirements and acceptance criteria.
- Assign new unique `FR-`, `NFR-`, or `AC-` IDs to new meaning. Never reuse a removed ID for different meaning.
- Keep Technical Design present and coherent at the level of components, boundaries, responsibilities, and flow.
- Add exact implementation details only when the feedback or a specification-scoped clarification answer supplies them.
- Represent every normative behavior or constraint under Requirements with a stable ID.
- Do not leave required behavior as unresolved alternatives to be selected during planning.
- Preserve unrelated user-supplied details and omit newly considered implementation choices left to planning.

## Examples

Feedback:

```text
Split password hashing from registration. Hashing must be reusable by password reset.
```

Good refinement:

- require a reusable hashing capability;
- keep registration behavior separate;
- update technical boundaries;
- add verification for both hashing and registration;
- update references if new project context was supplied.

Bad refinement:

- rename one heading while leaving registration requirements and testing unchanged.

Feedback with a line reference:

```text
specs/user-auth.md#L42-49 Lockout lasts 15 minutes, not until manual reset.
```

Read the referenced range and surrounding section. Update all affected behavior, security, state lifecycle, and test
expectations. Do not edit the referenced file if it is not the selected specification.

## Final Check

- The feedback is represented as behavior or a constraint, not as an accidental implementation task.
- Related sections agree.
- Unrelated requirements remain intact.
- Stable IDs, Technical Design, normative requirements, and resolved decisions pass the integrity rules above.
- Conflicts and material unknowns are resolved through clarification before saving.
- Consequences for the plan are explicit.
