# Project Analysis for Planning

Inspect only the scope needed for an executable plan.

## Scope

Classify briefly as new, existing, or monorepo. In a monorepo, identify the affected app/package/service first. Follow
project instructions and user boundaries; MUST NOT scan unrelated areas for appearance of thoroughness.

## Inspection

1. Read applicable project instructions and read-only Git status when available; preserve dirty user work.
2. Identify relevant manifests, module boundaries, entry points, configuration, and build tooling.
3. Trace current behavior through needed interfaces, callers, domain logic, storage/migrations, and integrations.
4. Find analogous implementations and naming/error-handling conventions.
5. Locate focused tests and broader required checks.
6. Verify commands from configuration/docs; verify every existing path/symbol used by the plan and label future files.

For a new project, put required infrastructure in prerequisites or Actions. MUST NOT invent conventions.

## Feed the Plan

Put verified evidence where used: approach in Overview; tools/environment in Prerequisites; paths/patterns in Context;
commands in Actions/criteria; credible failures in Risks; useful sources in References. MUST NOT add a Project Context
section or save uncertainty as an assumption.

## STOP and Clarify

STOP when the affected component is unknown, repository behavior contradicts the specification, dirty work materially
changes the plan, or unresolved architectural choices produce materially different steps. Classify the owner and
return control to the active command before writes.
