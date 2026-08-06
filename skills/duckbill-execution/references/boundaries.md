# Execution Boundaries

The command runtime captures a repository snapshot and supplies an explicit allowlist before implementation. Treat referenced files as context, not permission.

Allowed implementation writes are task-scoped application code, tests, configuration required by the task, and no Duckbill artifact. The runtime alone may write the feature state file after postflight checks.

Before work:

- confirm all target paths resolve inside the repository without symlink traversal;
- preserve every pre-existing changed path and its content;
- identify the smallest credible task-scoped path set;
- stop if the task requires a path outside that set until the runtime expands permission explicitly.

After work:

- return actual changed paths;
- run focused checks;
- compare actual command-created changes with the allowlist;
- treat any unauthorized path as a blocked successful outcome;
- never reset, clean, overwrite, or otherwise hide pre-existing user changes.

An unauthorized write is reported and left for user inspection. State must not record the task as completed.

Do not run destructive, deployment, production, or irreversible commands without explicit user authorization.
