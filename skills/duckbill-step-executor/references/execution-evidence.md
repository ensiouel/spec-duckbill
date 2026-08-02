# Step Execution Evidence

## Boundary Classification

| Class                 | Boundary                                                                                                                        | Result              |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------|---------------------|
| `execution`           | the selected step can be implemented under unchanged specification and plan intent                                              | execute             |
| `plan-level`          | approach, scope, prerequisites, Context, Actions, criteria, dependencies, validation, risks, mappings, or structure must change | stop without writes |
| `specification-level` | behavior, scope, constraints, contracts, data, security, acceptance, or high-level design must change                           | stop without writes |
| `material-unknown`    | required intent or ownership cannot be established                                                                              | stop without writes |

## Evidence

Use the strongest practical current evidence:

| Claim                 | Evidence                            |
|-----------------------|-------------------------------------|
| file/symbol           | inspect final file or search symbol |
| behavior              | focused test or safe reproduction   |
| build/type            | relevant build/compile/type-check   |
| format/static quality | project formatter/linter/analyzer   |
| configuration         | normal parser/validation command    |
| integration           | narrowest reliable integration test |

Writing code is not proof. A command proves only what its checks/output observe; a test name proves nothing beyond its
body. Evidence MUST be capable of revealing a violation. Protective/boundary behavior needs a negative or edge case.

Evaluate every criterion in plan order and preserve its stable `SC-###` ID. A `passed` result requires direct current
evidence. Use `failed` when current evidence reveals a violation and `blocked` when proof cannot be obtained. MUST NOT
reuse prior evidence after related code changes.

| Status      | Meaning                                                        |
|-------------|----------------------------------------------------------------|
| `completed` | every criterion passes                                         |
| `partial`   | implementation changed; at least one criterion failed/unproven |
| `failed`    | no intended implementation outcome was produced                |

## Internal Result

Produce labeled fields, not a standalone Markdown report:

- `classification`: `execution|plan-level|specification-level|material-unknown`;
- `outcome`: `completed|partial|failed|blocked`;
- `changedPaths`: sorted repository-relative paths, or `none`;
- `checksRun`: commands or inspections with result and evidence, or `none`;
- `criteria`: every selected-step criterion in plan order as `{id,result,evidence}`;
- `blockers`: conditions that prevented implementation or proof, or `none`;
- `unverifiedItems`: skipped or unavailable checks, or `none`;
- `materialUnknowns`: unresolved intent/ownership, or `none`.

Preserve all plan intent and requirement mappings. Include selected-step evidence only; do not derive plan-wide coverage
or persist workflow state. The active command owns those concerns, routing, and the terminal result.
