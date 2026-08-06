# Runtime Operations

Use this reference to translate command-level stages into deterministic script calls. Prompts select the stages. Runtime owns scripts, arguments, revision handling, snapshots, boundaries, state persistence, and final rendering.

## Common rules

- Resolve `<runtime-root>` from the active runtime skill. Never search for a package root or use project-local substitutes.
- Run scripts only as `node <runtime-root>/scripts/<name>.mjs ...`.
- Pass `--repo <repository-root> --feature <feature-id>` whenever supported.
- Read the current revision before every state mutation, pass it as `--expected-revision`, and use the returned revision for the next mutation.
- Serialize JSON arguments without changing their types.
- Keep artifact preimages in safe temporary regular files when reconciliation needs them.
- Capture the command snapshot before the first write. Preserve its pre-existing changed paths.
- Capture a fresh stage snapshot before every semantic call.
- A semantic stage boundary excludes state.json. A final boundary includes every path the whole command may write.
- Pass `allowedPreExistingPaths` explicitly. Artifact commands may touch their owned pre-existing artifacts and runtime may touch state.json. Code commands must block changes to pre-existing code/test/configuration paths.
- Never reset, clean, or hide unauthorized or pre-existing changes.
- Return structured data to the prompt. Render only during the `render` operation.

## `prepare`

Always resolve canonical paths with `repository.mjs feature-paths`, read state with `state.mjs read` when it exists, and capture the required snapshot with `repository.mjs snapshot` before a write. Validate only the artifacts required by the command.

Command-specific preparation:

- `duck-spec`: require the canonical matching draft. Run `check.mjs spec` for findings, but allow draft incompleteness before semantic work. Allow spec.md and state.json.
- `duck-plan`: require a ready valid spec, no current operation, no plan/tasks, and both regular bundled plan assets. Allow plan.md, tasks.md, and state.json.
- `duck-analyze`, scope `spec`: run `check.mjs spec`; keep all paths read-only.
- `duck-analyze`, scope `all`: run `check.mjs all` and `state.mjs status`; calculate evidence drift from current evidence; keep all paths read-only.
- `duck-sync`: require a ready valid spec, existing plan/tasks, and no unrelated operation. Capture spec/plan/tasks preimages. Missing downstream artifacts route to `duck-plan`. Allow plan.md, tasks.md, and state.json.
- `duck-execute`: run `check.mjs all`, `state.mjs status`, and evidence drift checks. Require ready/current artifacts, no unresolved clarification, an executable task status, valid mappings, current prerequisite/dependency evidence, and no CRITICAL/HIGH deterministic finding. A matching current execute may resume only when `startedFrom` is current. Allow verified task-scoped code/test/configuration paths and state.json.
- `duck-refine`, scope `spec`: require a valid refinement target and capture the old spec. Allow spec.md and state.json.
- `duck-refine`, scope `plan`: require ready spec and current plan/tasks, then capture their preimages. Allow plan.md, tasks.md, and state.json.
- `duck-refine`, scope `code`: use the execute preparation rules for the selected completed task. A matching repair resumes only with persisted feedback and current `startedFrom`. Allow verified task-scoped code/test/configuration paths and state.json.
- `duck-validate`: run `check.mjs all` and `state.mjs status`, capture all observed evidence paths, and require current artifacts, completed required tasks, current task evidence, no current operation/clarification, and no relevant drift. Allow only state.json.
- `duck-status`: run `state.mjs status` between two repository snapshots and require no repository change. Keep all paths read-only.

If another operation or clarification owns the feature, return its stored command without performing the requested mutation.

## `verify`

Call `repository.mjs boundary` with the stage snapshot, the stage write paths, and its explicit allowed pre-existing paths.

- Consistency analysis, semantic preflight, validation, and every other read-only stage use an empty write list.
- Specification and plan artifact stages use only their semantic artifact paths and never state.json.
- Implementation apply uses only verified task-scoped code/test/configuration paths and never state.json.
- A `blocked`, `failed`, `unchanged`, or clarification semantic result that promises no writes is verified with an empty write list.

Return blocked on an unauthorized path or protected pre-existing path. Never reset it. Capture and return a new stage snapshot only after the boundary passes.

## `clarify`

Accept only a typed semantic `needs_clarification` result. First enforce an empty-write `verify` for the semantic stage. Persist owner, questions, source command, skill mode, command arguments, and partial answers with `state.mjs clarify`. The script captures current artifact hashes. Check the command boundary with state.json as the only runtime write, then return the unanswered questions.

Do not ask the user directly. Do not treat questions or answers as intent artifacts.

## `resume`

Accept the prompt's internal `Q-###` answer map and call `state.mjs resume`. The answer map is not a user-facing command option.

- If all answers are not present, return remaining questions.
- If source hashes changed, discard the stale clarification and return `restartSemantic: true`.
- If complete and current, return the saved command, mode, arguments, and answers to the semantic call.
- Keep complete answers in state until `begin` or `finalize` consumes them atomically.

## `begin`

Use only for execute or code repair after successful semantic preflight.

1. Record complete current PRE evidence with `state.mjs record-prerequisites` when required.
2. Call `state.mjs begin` with operation type, task, command, persisted repair feedback/references, verified task write paths, the current repository snapshot, and the latest revision.
3. Do not call begin again for a verified matching current operation.
4. Return a stage snapshot captured after the state write so implementation apply has its own boundary baseline.

## `finalize`

Accept a typed semantic result. A clarification result belongs to `clarify`, not `finalize`. Verify the final semantic stage before any state transition. For `blocked`, `failed`, or `unchanged`, require its declared stage write set, using an empty set when the semantic contract promises no write, and build the command result without applying a success transition. Never hide deterministic findings behind a semantic result. CRITICAL or HIGH analysis findings produce `blocked`.

Use the branch for the active command:

- `duck-spec`: run `check.mjs spec`, require ready, check the spec.md semantic boundary, call `state.mjs record-spec`, then check the spec.md/state.json final boundary.
- `duck-plan`: run `check.mjs all`, check the plan.md/tasks.md semantic boundary, call `state.mjs reconcile` with absent old plan/tasks and suggested affected IDs, then check the plan.md/tasks.md/state.json final boundary.
- `duck-sync`: run `check.mjs all`, check the plan.md/tasks.md semantic boundary, call `state.mjs reconcile` with all preimages and suggested affected IDs, then check the plan.md/tasks.md/state.json final boundary.
- `duck-refine`, scope `spec`: run `check.mjs spec`, check the spec.md semantic boundary, call `state.mjs invalidate-spec` with the old spec, then check the spec.md/state.json final boundary. Missing plan/tasks remain missing.
- `duck-refine`, scope `plan`: use the sync finalization with plan/tasks preimages.
- `duck-execute` or `duck-refine`, scope `code`: derive the task outcome by `references/contracts.md`, call `state.mjs finish` with every CHK exactly once, then check the full task/state command boundary. Unauthorized or protected pre-existing paths force a blocked outcome and remain untouched.
- `duck-validate`: derive validation status by `references/contracts.md`, call `state.mjs record-validation` with every VAL exactly once, then check the state.json-only command boundary.
- `duck-analyze`: compare the before/after snapshots and require no change.

Bind CHK, PRE, and VAL evidence to current artifact hashes, commit, dirty-tree hash, observed path hashes, command exit code, and output digest before persisting it. Reject stale or incomplete evidence.

After finalization, use `state.mjs status` where available to select an exact deterministic Next command. Never select a task with incomplete dependencies. Never execute Next.

## `status`

Return these structured fields from `state.mjs status` unchanged: feature, artifact statuses, operation, clarification, task counts, staleness, validation, drift, and Next. Do not reinterpret them or infer intent from code.

## `render`

Validate the structured command result and render it only with `utils.mjs render --json <result>`. Return the rendered text without executing `next`.
