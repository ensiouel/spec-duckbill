# Initialization

Create `.duckbill/specs/<feature>/` and a minimal `spec.md` from `assets/spec-draft.md`.

Do not overwrite an existing feature workspace.

Preserve useful initial user context in the draft's Intent section. If no context was supplied, leave one concise
invitation for the user to describe intent; do not create a large empty form.

Initialization MUST NOT:

- mark the specification ready;
- create `plan.md` or `tasks.md`;
- create `.duckbill/constitution.md`;
- perform full specification authoring.

Stop after creating the workspace and draft. Report the changed path and that specification authoring is the next
semantic operation.
