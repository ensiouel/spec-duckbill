---
description: Validate current feature implementation and persist only validation evidence
argument-hint: "<feature>"
---

Validate feature `$1`.

## Skills

Load `duckbill-runtime`, `duckbill-consistency`, and `duckbill-validation`. Use modes `analyze-all` and `validate-feature`. If a required skill is unavailable, make no writes and return `blocked`.

## Permissions

All code and Markdown artifacts are read-only. Runtime may update only validation and evidence fields in canonical state.json.

## Flow

1. Parse feature.
2. Invoke `duckbill-runtime` with operation `prepare` for `duck-validate`.
3. Invoke `duckbill-consistency` in mode `analyze-all` with the constitution, artifacts, state metadata, runtime findings, and read-only permissions. Pass a blocking typed result to `duckbill-runtime` operation `finalize` and skip feature validation.
4. Invoke `duckbill-runtime` with operation `verify` for the read-only consistency stage.
5. Invoke `duckbill-validation` in mode `validate-feature` with the same artifacts, state metadata, and current repository context, then invoke runtime operation `verify` for the read-only validation stage.
6. Invoke `duckbill-runtime` with operation `finalize` for `duck-validate` and pass the typed validation result.
7. Invoke `duckbill-runtime` with operation `render` for the structured command result. Never execute Next.
