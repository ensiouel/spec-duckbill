---
description: Initialize a safe Duckbill feature workspace and state
argument-hint: "<feature> [description]"
---

Initialize feature `$1` with a minimal Feature Brief draft; optional seed description is `${@:2}`.

## Skills

Load only `duckbill-init`. If it or a required bundled resource is unavailable, make no writes and return `blocked`.

## Permissions

May create `.duckbill/constitution.md` only when absent, `.duckbill/specs/$1/spec.md`, and `.duckbill/specs/$1/state.json`. Everything else is read-only. No semantic skill is used.

## Flow

1. Parse one feature and optional description.
2. Invoke `duckbill-init` with those inputs and the declared permissions.
3. Present its structured result through the skill's renderer.
4. Never execute the returned Next command.
