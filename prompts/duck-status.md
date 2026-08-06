---
description: Show deterministic Duckbill feature, staleness, drift, and next-command status
argument-hint: "<feature>"
---

Show status for `$1`.

## Skills

Load only `duckbill-runtime`. If it is unavailable, remain read-only and return `blocked`.

## Permissions

Strictly read-only. Do not invoke a semantic skill.

## Flow

1. Parse feature.
2. Invoke `duckbill-runtime` with operation `status` using the declared read-only permissions.
3. Present the returned status data without reinterpreting it.
4. Invoke `duckbill-runtime` with operation `render` for the structured command result. Never execute Next.
