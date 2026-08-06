---
description: Read-only semantic consistency analysis of a specification or complete feature
argument-hint: "<feature> --scope spec|all"
---

Analyze feature `$1` with command arguments `${@:2}`.

## Skills

Load `duckbill-runtime`. For scope `spec`, load `duckbill-specification` in mode `analyze-spec`. For scope `all`, load `duckbill-consistency` in mode `analyze-all`. If a required skill is unavailable, remain read-only and return `blocked`.

## Permissions

All repository paths are read-only. Do not create a report file or update state.

## Flow

1. Parse feature and require scope `spec` or `all`.
2. Invoke `duckbill-runtime` with operation `prepare` for `duck-analyze` and the selected scope.
3. Invoke the selected semantic skill in its declared mode with the constitution, in-scope artifacts, runtime findings, relevant verified repository context, and read-only permissions.
4. Invoke `duckbill-runtime` with operation `verify` for the read-only semantic stage.
5. Invoke `duckbill-runtime` with operation `finalize` for the read-only analysis using both deterministic and semantic findings.
6. Invoke `duckbill-runtime` with operation `render` for the structured command result. Never execute Next.
