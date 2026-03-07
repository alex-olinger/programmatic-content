# Programmatic Content Site

A deterministic content factory: structured JSON datasets → computed page definitions → generated markdown files → frontend rendering.

## Architecture

```
content/data/        Structured datasets (source of truth)
content/index/       Computed site plan (page-definitions.json)
content/pages/       Generated markdown pages
src/lib/             Engine libraries (slugify, rules, builders, markdown, validate)
src/types/           TypeScript types
scripts/             Pipeline scripts
apps/web/            Frontend render layer (Phase 3)
docs/                Architecture documentation
```

## Workflow

```bash
pnpm install

pnpm compute-pages    # data → page-definitions.json
pnpm generate-pages   # page-definitions.json → content/pages/*.md
pnpm qa-check         # validate definitions + generated files

pnpm clean            # remove generated artifacts
```

## Pipeline

```
loadData()             reads content/data/**/*.json
applyAllRules()        produces PageDefinition[] from 9 page-type rules
deduplicateBySlug()    drops duplicate slugs (keep first)
writeSitePlan()        writes content/index/page-definitions.json
renderMarkdown()       turns each PageDefinition into a .md file
validateAll()          checks slugs, frontmatter, tool counts
```

## Page Types

| Type              | Slug Pattern                      | Min Tools |
|-------------------|-----------------------------------|-----------|
| category          | best-{category}-tools             | 3         |
| audience-category | {category}-tools-for-{audience}   | 2         |
| use-case          | tools-for-{use-case}              | 2         |
| audience-use-case | {use-case}-tools-for-{audience}   | 2         |
| feature           | tools-with-{feature}              | 2         |
| pricing           | {tier}-{category}-tools           | 2         |
| alternatives      | alternatives-to-{tool}            | 2 alts    |
| comparison        | {tool-a}-vs-{tool-b}              | shared cat|
| tool-detail       | {tool}-review                     | 1         |

## LLM Boundary

`src/lib/llm.ts` contains `generateNarrative()`. Currently returns placeholder comments. Swap the implementation for real Claude/OpenAI calls when ready — page structure is never decided by the LLM.
