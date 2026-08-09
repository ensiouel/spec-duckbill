# Specification Analysis

Read the complete specification, applicable project instructions, optional constitution, and authoritative references
needed to assess product meaning.

Review only specification quality and planning readiness. Look for meaningful issues such as:

- ambiguity or contradiction;
- missing material product decisions;
- missing happy-path, failure, edge, permission, security, privacy, data, contract, or compatibility behavior when
  relevant;
- untestable requirements or acceptance that cannot demonstrate completion;
- accidental scope expansion or weak boundaries;
- discretionary implementation detail that belongs to planning;
- unstable, missing, duplicated, or misleading `R` and `A` identifiers;
- a `ready` status that does not satisfy the readiness test.

Analysis MUST be read-only and MUST NOT repair findings. It MUST NOT review the plan, tasks, and code as a separate
all-layers operation.

Report concrete findings in priority order. For each finding, include the affected ID or section when available, why it
matters, and the semantic owner and needed change. State clearly when no material specification issue was found.
