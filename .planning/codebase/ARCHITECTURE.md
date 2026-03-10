# ARCHITECTURE.md — System Design & Patterns

## Pattern
**Deterministic Content Factory** — a linear pipeline that transforms structured data into SEO pages through a series of pure functional transformations. No server, no database, no runtime state.

## Architecture Style
- **Pipeline / ETL** architecture
- Functional composition (no classes, no OOP)
- Strict layer separation with one-directional data flow
- LLM boundary explicitly enforced — narratives only, never structure

## Layers

### Layer 1: Structured Data (`content/data/`)
Source of truth. JSON files organized as:
- `content/data/tools/` — individual tool entries
- `content/data/taxonomy/audiences.json` — audience segments
- `content/data/taxonomy/categories.json` — tool categories
- `content/data/taxonomy/features.json` — feature flags
- `content/data/taxonomy/integrations.json` — integration types
- `content/data/taxonomy/price-tiers.json` — pricing tiers
- `content/data/taxonomy/use-cases.json` — use case types

Loaded via `src/lib/loadData.ts` → returns typed `Dataset` object.

### Layer 2: Page Definition Index (`content/index/`)
**Canonical site plan.** Rules compute all possible pages from entity combinations.

Pipeline:
1. `applyAllRules(dataset)` — 9 rule functions emit raw `PageDefinition` candidates
2. `validateCandidates(candidates)` — threshold + overlap checks
3. `deduplicateCandidates(validated)` — canonical key + slug dedup
4. `buildPageIndex(candidates)` — assembles `PageIndex` with valid + rejected
5. Written to `content/index/page-definitions.json` (gitignored)
6. Summary report: `content/index/page-definition-report.json` (gitignored)

Key files: `src/lib/pageRules.ts`, `src/lib/pageIndex.ts`, `src/lib/pageBuilders.ts`

### Layer 3: Content Generation (`content/pages/`)
Reads valid `PageDefinition`s from index, generates markdown per page.

- Template rendering is deterministic (tool lists, comparison tables)
- LLM call points (`src/lib/llm.ts`) return placeholder comments (not yet integrated)
- Stale file cleanup: deletes all `.md` before regenerating
- Written to `content/pages/*.md` (gitignored)

Key file: `scripts/generate-pages.ts`, `src/lib/markdown.ts`, `src/lib/llm.ts`

### Layer 4: Validation (`qa-check`)
Post-generation correctness checks via `src/lib/validate.ts`:
- Duplicate slug/ID/key detection
- Min-tool threshold enforcement
- YAML frontmatter completeness
- Required section heading presence
- Orphan file detection

Key file: `scripts/qa-check.ts`, `src/lib/validate.ts`

### Layer 5: Frontend (`apps/web`)
Renders generated markdown. Responsibilities:
- Slug routing
- Markdown rendering
- Metadata output
- Page layout

**Constraint**: frontend must never compute page definitions.

## Data Flow
```
content/data/ (JSON)
    ↓ loadData()
Dataset (typed)
    ↓ applyAllRules() — 9 rule functions
PageDefinition[] candidates
    ↓ validateCandidates() + deduplicateCandidates()
PageDefinition[] validated
    ↓ buildPageIndex() + writePageIndex()
content/index/page-definitions.json
    ↓ generate-pages.ts
content/pages/*.md
    ↓ apps/web
Rendered site
```

## Key Abstractions
| Abstraction | Location | Purpose |
|-------------|----------|---------|
| `Dataset` | `src/types/entities.ts` | Loaded data container |
| `PageDefinition` | `src/types/pages.ts` | Single page spec (slug, type, matchedToolIds, sections, validity) |
| `PageIndex` | `src/types/pages.ts` | Full index with all candidates + metadata |
| `PageType` | `src/types/pages.ts` | 9 page types (union type) |
| `SectionName` | `src/types/pages.ts` | 6 section types (union type) |
| `MIN_TOOLS` | `src/lib/pageRules.ts` | Per-type minimum tool threshold map |

## Entry Points
| Command | Script | Purpose |
|---------|--------|---------|
| `pnpm compute-pages` | `scripts/compute-pages.ts` | Data → page definition index |
| `pnpm generate-pages` | `scripts/generate-pages.ts` | Index → markdown files |
| `pnpm qa-check` | `scripts/qa-check.ts` | Validate generated output |
| `pnpm pipeline` | All three chained | Full pipeline in one command |
| `pnpm typecheck` | `tsc --noEmit` | TypeScript validation |

## Page Rule Types (9 total)
| Rule | Slug Pattern | Min Tools |
|------|-------------|-----------|
| `category` | `best-{cat}-tools` | 3 |
| `audience-category` | `{cat}-tools-for-{aud}` | 2 |
| `use-case` | `tools-for-{uc}` | 2 |
| `audience-use-case` | `{uc}-tools-for-{aud}` | 2 |
| `feature` | `tools-with-{feat}` | 3 |
| `pricing` | `{tier}-{cat}-tools` | 2 |
| `alternatives` | `alternatives-to-{tool}` | 3 |
| `comparison` | `{tool-a}-vs-{tool-b}` | 2 + overlap ≥ 2 |
| `tool-detail` | `{tool}-review` | 1 |

## LLM Boundary
`src/lib/llm.ts` defines the LLM call surface. Currently returns placeholder comments.
- LLM generates: introduction, bestFor, prosAndCons, faq sections
- LLM never touches: slug, matchedToolIds, entities, pageType, section structure
- `sections` field on `PageDefinition` encodes which sections are `'llm'` vs `'deterministic'`
