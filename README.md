# Spec Duckbill

Spec Duckbill is a Pi package for a controlled `spec -> plan -> steps` development workflow.

## Installation

Install the package directly from GitHub:

```bash
pi install https://github.com/ensiouel/spec-duckbill
```

For local development, run this command from the repository root:

```bash
pi install .
```

Requirements: Pi, Node.js 20 or newer, and Git.

Add generated step patches to the target project's `.gitignore`:

```gitignore
specs/plans/*/steps/*.patch
```

## Quick start

```text
/duck-init Password Authentication
/duck-spec specs/password-authentication.md
/duck-plan specs/password-authentication.md
/duck-execute specs/plans/password-authentication/plan.md hash-password
```

`/duck-init` creates a draft with a `[WRITE HERE]` placeholder. Replace that line with the feature description before
running `/duck-spec`. Duckbill asks about important unknowns before completing a specification or plan.

Every command ends with:

```text
Changed: <changed files or none>
Status: <current result>
Next: <next Duckbill command or none>
```

## Core workflow

```text
/duck-init <specification name>
/duck-spec <spec-file>
/duck-plan <spec-file>
/duck-execute <plan-file> <step>
```

Use the stable step ID for `<step>`. A step number or quoted heading is also accepted.

`/duck-execute` implements exactly one step and checks each of its success criteria. Steps run in plan order. After the
last step, Duckbill runs the plan's final validation checklist.

## Advanced refinement

```text
/duck-refine-spec <spec-file>[#L<line>[-<end>]] <feedback>
/duck-refine-plan <plan-file>[#L<line>[-<end>]] <step|whole> <feedback>
/duck-refine-code <plan-file>[#L<line>[-<end>]] <step> <feedback>
```

Examples:

```text
/duck-refine-spec specs/user-auth.md#L35 Require one-time recovery links
/duck-refine-plan specs/plans/user-auth/plan.md#L70-110 whole Reorder these steps by dependency
/duck-refine-plan specs/plans/user-auth/plan.md store-user Split storage from API work
/duck-refine-code specs/plans/user-auth/plan.md hash-password src/auth/password.go#L42 Preserve the original error
```

A file reference may select a whole file, one line, or a line range. It supplies context but does not grant permission to
change that file.

## Generated files

The specification and plan point to each other through frontmatter:

```yaml
# specs/password-authentication.md
---
plan-file: specs/plans/password-authentication/plan.md
---
```

```yaml
# specs/plans/password-authentication/plan.md
---
spec-file: specs/password-authentication.md
---
```

Each plan has its own directory:

```text
specs/
├── password-authentication.md
└── plans/
    └── password-authentication/
        ├── plan.md
        └── steps/
            └── <step-id>.patch
```

Specifications use stable requirement IDs such as `FR-001`, `NFR-001`, and `AC-001`. Plans map them to stable step IDs
such as `hash-password`.

Refining a specification or plan may mark affected executed steps as `stale`. Execute those steps again before treating
the plan as complete.

## Safety and limitations

Every step patch contains only changes made after that step's baseline. Patches are not cumulative. The patch builder
uses a temporary Git index, so it does not stage files in the user's real index. It does not create commits, branches,
stashes, or worktrees. Repositories without a first commit are supported through Git's empty tree.

Duckbill excludes the governing specification, plan, and generated step patches from an implementation patch. It does
not exclude the entire `specs/` directory because projects may keep code or test data there.

Generated patches are review artifacts, not a substitute for commits or backups. Commands may still edit project files
while executing an approved plan step.

`/duck-plan` may replace only an untouched plan after confirmation. Use `/duck-refine-plan` when a plan already has
execution state, execution records, or step patches.

## Development

Run the tests and syntax checks:

```bash
npm test
npm run check
```

The test suite uses Node.js's built-in test runner and requires Git. CI runs on Linux and Windows.

## License

[MIT](LICENSE)
