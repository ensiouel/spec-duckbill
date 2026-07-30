---
name: duckbill-spec-author
description:
  Initialize a minimal editable specification draft or develop an initialized Markdown draft into a complete technical
  specification. Use when `/duck-init` needs deterministic draft creation, or after the user has added a description,
  constraints, references, or project-analysis instructions and needs the draft expanded before implementation planning.
---

# Duckbill Spec Author

Initialize a specification draft or develop it into an actionable specification. Follow only the mode requested by the
calling prompt.

## Initialization Mode

When the calling prompt requests initialization:

1. Resolve `scripts/init-spec.mjs` relative to this `SKILL.md`.
2. Run:

```bash
node <this-skill-directory>/scripts/init-spec.mjs \
  --repo <repository-root> \
  --name "<complete specification name>"
```

3. Read the JSON result and return its repository-relative `path`.

Pass the complete user-supplied name as one `--name` value. Do not derive the filename, write the draft manually,
overwrite an existing file, inspect the project, or develop the specification.

## Authoring Mode

### Input

Use the complete draft file, its frontmatter, user-written description, constraints, references, project-analysis
instructions, resolved clarification answers, and target path supplied by the calling prompt. Treat them as the source
of truth.

### Required Reference

Read [references/spec-format.md](references/spec-format.md) before developing or substantially rewriting a
specification.

### Procedure

1. Read the complete initialized draft and understand the problem, intended outcome, boundaries, and important
   constraints.
2. Separate stated facts, verified project facts, high-level technical design, explicitly supplied exact implementation
   details, implementation discretion, and material unknowns.
3. Inspect relevant project files only when existing architecture, behavior, or conventions affect the specification.
4. Choose useful sections from the adaptive template.
5. Write the specification using `spec-format.md`.
6. Keep implementation discretion separate from required behavior. Preserve exact details explicitly supplied by the
   user and leave unconstrained implementation choices to planning.
7. When a material unknown remains, you MUST return it to the calling prompt and stop before finalizing. Do not ask the
   user directly; the prompt owns clarification.
8. Preserve user-owned frontmatter and user intent. Remove initialization guidance and temporary `status` after the
   calling prompt confirms clarification readiness, remove empty frontmatter, and add `plan-file` only when a plan
   exists.
9. Re-read the document and apply the Quality Check in `spec-format.md`.

### Boundaries

- Do not invent product requirements or project facts.
- Do not violate the content boundaries in `spec-format.md`.
- Do not create an implementation plan unless the calling prompt explicitly requests it.
- Do not replace user-authored intent with inferred requirements.

### Result

Return the saved path, scope summary, resolved decisions, and requirements that need special attention during planning.
