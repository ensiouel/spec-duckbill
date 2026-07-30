# Project Analysis for Planning

Read this reference before choosing implementation steps for an existing specification.

## Establish Scope

Classify the repository briefly:

- **new**: little or no relevant implementation exists;
- **existing**: the feature belongs to an established codebase;
- **monorepo**: first identify the affected application, package, or service.

Respect project instructions and user-provided analysis boundaries. Do not scan unrelated areas merely to appear
thorough.

## Inspect Related Implementation

For the affected scope:

1. Read applicable project instructions.
2. Inspect repository status with a read-only `git status` command when Git is available. Record only changes relevant
   to planning; do not modify or clean the working tree.
3. Identify manifests, module boundaries, entry points, configuration, and build tooling.
4. Trace the current behavior through relevant interfaces, callers, domain logic, storage, migrations, and external
   integrations.
5. Find similar implementations and established naming or error-handling patterns.
6. Locate focused tests and broader checks that cover the affected behavior.
7. Verify commands from project configuration or documentation instead of guessing them.
8. Verify every existing path or symbol referenced by the plan. Label future paths as files to create.

For a new project, record required infrastructure as a prerequisite or planned action. Ask the user when its shape
materially changes the plan. Do not invent existing conventions.

## Feed the Plan

Use verified evidence in the plan's Overview, Prerequisites, step Context, Actions, Success Criteria, Risks, and
References. Do not create a separate Project Context section.

## Stop and Clarify

Ask for clarification when:

- the affected monorepo component cannot be identified;
- current behavior contradicts the specification;
- a dirty working-tree change materially changes the intended plan;
- different architectural choices would produce substantially different steps.

Also ask when another material implementation decision cannot be resolved from the specification or established project
conventions. Do not hide it as an assumption.
