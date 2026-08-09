# Task Work

## Shared preparation

Read the complete current specification, plan, tasks, and selected task. Stop if the task is absent, ambiguous, or
incompatible with current upstream artifacts. Feature-wide acceptance belongs to validation.

Inspect relevant code, tests, configuration, interfaces, similar implementations, and project conventions. Preserve
unrelated user changes and use the repository diff to detect accidental edits.

## Execute operation

Execute performs pending task work. Verify that every dependency is `completed`. Stop if a dependency is pending or the
selected task is already `completed`. For a completed task, explain that new implementation feedback should use code
refinement; do not reopen or mutate it during execute.

## Code refinement operation

Code refinement applies new feedback to one explicit task within established upstream meaning. The selected task MAY be
`pending` or `completed`; an existing `completed` status MUST NOT by itself block refinement.

Before any code write, evaluate the feedback against the current specification, current plan, current task definition,
and current implementation. If the feedback changes technical design or product meaning, use the ownership guidance and
stop before mutation. Otherwise apply the implementation refinement, run relevant verification, and reconsider the
selected task's completion status against all four inputs.

## Implement and verify

Implement the smallest coherent change that satisfies exactly the selected outcome. Tests that naturally demonstrate the
outcome SHOULD land with the implementation rather than as a separate bookkeeping task.

Run relevant task verification and safe project checks. Verification SHOULD directly exercise the task's `Verify`
statements and affected behavior. Do not treat an old result or existing `completed` label as current proof.

Update only the selected task's status. Set it to `completed` when the current implementation satisfies the current task
definition and upstream artifacts. Otherwise keep or return it to `pending` and report the evidence and blocker. A
previous `completed` value is context, not proof and not a third status.

Stop after one task or one code refinement.
