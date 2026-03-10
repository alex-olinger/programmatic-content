# STRUCTURE.md — Directory Layout & Organization

## Root Layout
```
programmatic-content/
├── content/                  # Content layer (data + generated output)
│   ├── data/                 # Source of truth — JSON datasets
│   │   ├── tools/            # Individual tool JSON files
│   │   └── taxonomy/         # Shared taxonomy entities
│   ├── index/                # Generated artifacts (gitignored)
│   │   ├── page-definitions.json
│   │   └── page-definition-report.json
│   └── pages/                # Generated markdown pages (gitignored)
├── scripts/                  # Pipeline entry point scripts
│   ├── compute-pages.ts
│   ├── generate-pages.ts
│   └── qa-check.ts
├── src/
│   ├── lib/                  # Core business logic
│   └── types/                # TypeScript type definitions
├── apps/
│   └── web/                  # Next.js frontend (slug routing + rendering)
├── docs/                     # Architecture documentation
├── .planning/                # GSD planning directory
│   └── codebase/             # This codebase map
├── CLAUDE.md                 # AI assistant instructions
├── package.json
└── tsconfig.json
```

## `content/data/` — Source of Truth
```
content/data/
├── tools/                    # One JSON file per tool (e.g., notion.json)
└── taxonomy/
    ├── audiences.json        # Audience segment definitions
    ├── categories.json       # Tool category definitions
    ├── features.json         # Feature flag definitions
    ├── integrations.json     # Integration type definitions
    ├── price-tiers.json      # Pricing tier definitions
    └── use-cases.json        # Use case definitions
```

## `src/lib/` — Core Library
```
src/lib/
├── loadData.ts       # Loads + parses all content/data/ JSON → Dataset
├── pageRules.ts      # 9 page rule functions + MIN_TOOLS + MIN_OVERLAP_SCORE
├── pageBuilders.ts   # buildPageDefinition() factory function
├── pageIndex.ts      # validateCandidates, deduplicateCandidates, buildPageIndex, I/O
├── markdown.ts       # Markdown generation helpers + yamlEscape()
├── validate.ts       # Post-generation qa validation (9 checks)
├── slugify.ts        # Slug generation utility
└── llm.ts            # LLM boundary — generateNarrative() (placeholder)
```

## `src/types/` — TypeScript Types
```
src/types/
├── entities.ts       # Tool, Dataset, Category, Audience, etc.
└── pages.ts          # PageDefinition, PageIndex, PageType, SectionName, etc.
```

## `scripts/` — Pipeline Scripts
```
scripts/
├── compute-pages.ts  # Entry: data → page-definitions.json
├── generate-pages.ts # Entry: page-definitions.json → content/pages/*.md
└── qa-check.ts       # Entry: validates content/pages/ against index
```

## `docs/` — Architecture Documentation
```
docs/
├── build-sequence.md                            # Official architecture evolution order
├── project-map.md                               # Directory structure and layer responsibilities
├── ai-editing-rules.md                          # Safety rules for AI-assisted modifications
├── content-engine-rules.md                      # Page generation rules spec
├── workflow-diagram.md                          # Visual pipeline diagram
├── code-walkthrough-pagedefinition-to-pageindex.md
└── code-walkthrough-src-lib-pageRules.md
```

## Key File Locations
| What | Where |
|------|-------|
| Tool data | `content/data/tools/*.json` |
| Taxonomy | `content/data/taxonomy/*.json` |
| Page index (generated) | `content/index/page-definitions.json` |
| Summary report (generated) | `content/index/page-definition-report.json` |
| Generated pages (generated) | `content/pages/*.md` |
| Page types | `src/types/pages.ts` |
| Entity types | `src/types/entities.ts` |
| Rule logic | `src/lib/pageRules.ts` |
| Min thresholds | `src/lib/pageRules.ts` (MIN_TOOLS, MIN_OVERLAP_SCORE) |
| Slug utilities | `src/lib/slugify.ts` |
| Markdown helpers | `src/lib/markdown.ts` |
| LLM boundary | `src/lib/llm.ts` |

## Naming Conventions
| Item | Convention | Example |
|------|-----------|---------|
| Source files | camelCase | `pageRules.ts`, `loadData.ts` |
| Script files | kebab-case | `compute-pages.ts`, `qa-check.ts` |
| Generated JSON | kebab-case | `page-definitions.json` |
| Generated pages | kebab-case slugs | `best-ai-writing-tools.md` |
| Taxonomy files | kebab-case | `price-tiers.json`, `use-cases.json` |
| Tool data files | kebab-case | `notion.json`, `copy-ai.json` |

## .gitignore
Generated artifacts are gitignored:
- `content/index/` — computed page index and report
- `content/pages/` — generated markdown files

Source data, scripts, and types are committed.
