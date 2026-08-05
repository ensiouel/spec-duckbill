# Evidence Staleness

Evidence becomes stale when any fact needed for its claim changes:

- an observed path is changed, removed, replaced, or resolves differently;
- a mapped requirement, relevant acceptance criterion, or scenario meaning changes;
- a relevant plan constraint changes;
- the task's actions, checks, mappings, or dependencies change;
- the task is in the runtime affected set;
- the recorded commit changes when commit identity is required for the proof.

An unrelated dirty path does not by itself invalidate task evidence whose observed paths and governing artifacts are unchanged. It still appears as repository drift in status and may block feature validation when the change affects the validated snapshot.

Feature validation becomes stale when a required task or evidence becomes stale, specification/plan/tasks hashes change, a relevant observed path changes, or the relevant repository snapshot no longer matches.

Stale evidence is historical information only. It never counts as passed. Preserve attempts and stale reasons, but clear current check evidence when task reconciliation invalidates it.

Repository drift is detected from commit, dirty-tree hash, observed path hashes, and artifact hashes. Never infer new intent from drift. Recovery requires status, all-scope analysis, validation, then an explicit refinement scope chosen by the user.

