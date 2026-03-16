# Architecture Rules

## Documentation Discovery

Before making architectural or structural changes, read the `docs/` directory.

Key documents:
- `docs/build-sequence.md` — official architectural evolution order
- `docs/project-map.md` — directory structure and layer responsibilities
- `docs/ai-editing-rules.md` — safety rules for AI-assisted modifications

If implementation conflicts with documentation:
1. Assume documentation reflects architectural intent
2. Propose a minimal correction rather than rewriting architecture
3. Update documentation only if the architecture intentionally changes

## Architecture Freeze

The following layers are **stable** and must not be rewritten unless explicitly instructed:

- Structured data layer (`content/data`)
- Page-definition computation
- Site-plan artifact (`content/index/page-definitions.json`)
- Content generation pipeline
- Frontend rendering layer (`apps/web`)

If a change appears to require rewriting these layers: stop, explain why, propose a minimal modification instead.

## Deterministic vs LLM Responsibilities

**Deterministic system decides:** page structure, slug generation, entity relationships, tool inclusion, comparison data.

**LLM generates:** narrative prose, summaries, introductions, FAQ answers.

LLM must **never alter page structure**.

## Editing Guidelines

- Respect architecture boundaries
- Modify generation logic rather than generated files
- Preserve the deterministic pipeline
- Keep implementations simple and explicit
- Do not introduce databases, background job systems, or complex infrastructure unless explicitly requested
