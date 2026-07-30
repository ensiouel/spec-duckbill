---
name: duckbill-clarifier
description:
  Identify and resolve material unknowns before completing a technical specification or implementation plan. Use while
  authoring or refining specifications and plans when missing product, scope, contract, project, or implementation
  decisions could change requirements, step boundaries, dependencies, risks, or success criteria.
---

# Duckbill Clarifier

Prevent unresolved decisions from being hidden as assumptions.

## Required Reference

Read [references/clarification-policy.md](references/clarification-policy.md) before deciding whether an artifact is
ready.

## Procedure

1. Identify the current phase and artifact: specification authoring or refinement, plan authoring or refinement, or plan
   synchronization after a specification change. Read the current artifact, its linked source of truth when present,
   supplied feedback, applicable project instructions, and already verified project context.
2. Investigate questions that can be answered safely from the repository before asking the user.
3. Classify each unresolved decision by destination:
    - `[spec]` when different answers change required behavior, scope, constraints, contracts, data rules, security, or
      acceptance expectations;
    - `[plan]` when different answers change only implementation approach, affected paths or symbols, step boundaries,
      dependencies, commands, rollout, risks, or implementation evidence.
4. Ask only questions material to the current readiness gate. While completing a specification, do not ask plan-only
   questions or let them block specification readiness. While completing a plan, ask both `[spec]` and `[plan]`
   questions when needed.
5. Ask the smallest useful batch of focused questions. Show the `[spec]` and `[plan]` legend once, prefix every question
   with its destination tag, and explain choices briefly when alternatives have meaningful trade-offs.
6. Wait for the user's answers. You MUST NOT complete the current artifact while a question material to its readiness
   gate remains unanswered.
7. Route each answer to the owning artifact:
    - apply `[spec]` answers through the specification authoring or refinement workflow, then synchronize an existing
      plan;
    - apply `[plan]` answers only through the plan authoring or refinement workflow.
8. When an answer unexpectedly contradicts an existing requirement or recorded plan decision, show the affected
   requirement IDs, step IDs, or exact decision and ask for confirmation before applying it. Do not ask again when the
   user already requested that change explicitly.
9. Recheck every affected artifact with its own readiness gate. Repeat only when an answer exposes another material
   unknown.

## Boundaries

- Do not invent an answer or hide a material decision as an assumption.
- Do not make a downstream implementation choice block an upstream specification when it does not change required
  behavior or constraints.
- Leave harmless details to implementation when they do not change the plan.
- Do not write competing alternatives into a completed artifact and defer the selection to a later phase. Ask when the
  current artifact owns the decision; otherwise omit the alternatives from that artifact and resolve them in the owning
  phase.
- Do not continue merely because a default is common. Present the default as a recommendation and ask when alternatives
  materially differ.

## Result

Return either a tagged question batch and pause, or confirm that no material unknowns remain and list which artifact and
requirement IDs, plan step IDs, or plan sections each resolved answer affects.
