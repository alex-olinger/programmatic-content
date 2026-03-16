# Workflow Diagram — Programmatic Content Site

## High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     STRUCTURED DATA                         │
│                      content/data/                          │
│                                                             │
│  tools.json   categories.json   audiences.json              │
│  use-cases.json   features.json   pricing.json              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   PAGE DEFINITION LAYER                     │
│              src/lib/pageRules.ts → pageIndex.ts            │
│                                                             │
│  9 rule functions → 70 candidates → validateCandidates()    │
│                          │                                  │
│                     48 valid  +  22 rejected                │
│                          │                                  │
│              content/index/page-definitions.json            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONTENT GENERATION LAYER                   │
│             src/lib/markdown.ts + llm.ts                    │
│                                                             │
│   deterministic ──────────────────────── LLM               │
│   (structure, slugs,                  (prose, summaries,    │
│    entity links,                       FAQs, intros)        │
│    tool matching)                                           │
│                          │                                  │
│                   content/pages/*.md                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND RENDER LAYER                     │
│                       apps/web/                             │
│                                                             │
│   slug routing → markdown load → metadata → page layout     │
│                                                             │
│   static build (category, tool-detail, alternatives,        │
│                  use-case, feature)                         │
│   ISR 24h      (everything else)                            │
└─────────────────────────────────────────────────────────────┘


PIPELINE:  pnpm compute-pages → pnpm generate-pages → pnpm qa-check

CORE LIB:  src/lib/   (46 symbols, fan-in 21)
           ├── loadData.ts      ├── pageRules.ts
           ├── slugify.ts       ├── pageIndex.ts
           ├── validate.ts      ├── markdown.ts
           └── llm.ts

SCRIPTS:   scripts/compute-pages.ts   scripts/generate-pages.ts
           scripts/qa-check.ts        scripts/compute-graph.ts
           (thin orchestrators — all logic delegates to src/lib/)
```

---

## Detailed Data-Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        content/data/                            │
│                                                                 │
│   tools/tools.json          taxonomy/categories.json           │
│                             taxonomy/audiences.json             │
│                             taxonomy/use-cases.json             │
│                             taxonomy/features.json              │
│                             taxonomy/price-tiers.json           │
│                             taxonomy/integrations.json          │
│                                                                 │
│   7 flat JSON arrays — source of truth for all entities         │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │  loadData()  ← scripts/compute-pages.ts only
                               │              (generate-pages + qa-check do NOT call loadData)
                               ▼
                          Dataset{}
                  (tools, categories, audiences,
                   useCases, features, priceTiers,
                   integrations all in memory)
                               │
                               │  applyAllRules()
                               │  9 rule functions, combinatorial expansion
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PageDefinition[]                            │
│                      raw candidates                             │
│                                                                 │
│  each entity combination that matches ≥1 tool becomes one       │
│  candidate — slug, pageType, matchedToolIds, entities, sections │
│                                                                 │
│  e.g. notion × writing × marketers → one audience-category page │
│       notion × jasper             → one comparison page         │
│       notion                      → one tool-detail page        │
│                                                                 │
│                      ~70 candidates                             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │  validateCandidates()
                               │  MIN_TOOLS threshold per type
                               │  MIN_OVERLAP_SCORE for comparisons
                               │
                               │  deduplicateCandidates()
                               │  canonical key + slug dedup
                               │  first-seen wins
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│               content/index/page-definitions.json               │
│                                                                 │
│  PageIndex — full site map, all candidates retained             │
│                                                                 │
│  isValid: true  → 48 pages  (will be rendered)                  │
│  isValid: false → 22 pages  (audit trail, not rendered)         │
│                                                                 │
│  per page: slug, pageType, matchedToolIds, entities,            │
│            isValid, rejectionReason, warnings, sections         │
│                                                                 │
│  NO page content — metadata only                                │
└──────────────┬──────────────────────────┬───────────────────────┘
               │                          │
               │                          │  buildReport()
               │                          ▼
               │           content/index/page-definition-report.json
               │           counts by type, rejection reasons, warnings
               │
               │  loadPageIndex()
               │  filter isValid === true
               │  renderMarkdown()  ← also reads content/data/ for
               │                      tool details (names, descriptions)
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      content/pages/*.md                         │
│                                                                 │
│  one .md file per valid page                                    │
│                                                                 │
│  each file contains:                                            │
│    - YAML frontmatter  (slug, pageType, matchedToolIds, ...)    │
│    - deterministic sections  (tool list, comparison table)      │
│      computed fresh from content/data/ every regeneration       │
│    - LLM sections  (introduction, bestFor, prosAndCons, faq)    │
│      currently: <!-- LLM_PLACEHOLDER: ... --> comments          │
│                                                                 │
│  safe to delete and regenerate — output is deterministic        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │  qa-check.ts
                               │  validateAll()
                               │  checks frontmatter, slugs, tool counts,
                               │  file presence, section headings
                               │  exits non-zero on errors
                               ▼
                          ✓ pipeline complete
                          ready for frontend rendering (Phase 3+)
                               │
                               │  apps/web/  (not yet built)
                               ▼
                     slug → route → render .md → user
```

---

## Key Facts

| Thing | What it is |
|---|---|
| `content/data/*.json` | source of truth — 7 files, flat entity arrays |
| `Dataset{}` | all entities loaded into memory, one object |
| `PageDefinition[]` | combinatorial expansion — one entry per entity combination |
| `page-definitions.json` | full site map — all candidates, valid and invalid |
| `content/pages/*.md` | rendered output — one file per valid page, no content stored elsewhere |

## Pipeline Commands

```
pnpm compute-pages     # data → PageIndex
pnpm generate-pages    # PageIndex → .md files
pnpm qa-check          # validate everything
pnpm clean             # delete content/pages/ and content/index/
```

Full rebuild is safe and idempotent — same data always produces same output.
