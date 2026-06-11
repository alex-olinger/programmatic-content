# Programmatic Content Site

A deterministic content factory: structured JSON datasets → computed page definitions → page-definition index → generated markdown files → frontend rendering.

📐 **[Architecture diagrams →](https://alex-olinger.github.io/programmatic-content/)** — auto-rendered from `docs/diagrams/*.puml` on every push to `main`.

## Architecture

```
content/data/        Structured datasets (source of truth)
content/index/       Page-definition index + report (computed, gitignored)
content/pages/       Generated markdown pages (gitignored)
src/lib/             Engine libraries
src/types/           TypeScript types
scripts/             Pipeline scripts
apps/web/            Frontend render layer (Next.js App Router)
docs/architecture/   System structure, build order, entity graphs, workflow diagrams
docs/diagrams/       PlantUML sources rendered to GitHub Pages
docs/rules/          Editing rules and content engine rules
docs/walkthroughs/   Code walkthroughs and implementation deep-dives
docs/plans/          Task plans written during development
```

## Workflow

```bash
pnpm install

pnpm pipeline         # run the full pipeline (the four steps below, in order)

pnpm compute-pages    # data → page-definitions.json + report
pnpm compute-graph    # entity-graph.json + page-links.json
pnpm generate-pages   # valid definitions → content/pages/*.md
pnpm qa-check         # validate definitions + generated files

pnpm clean            # remove generated artifacts
```

## Pipeline

```
compute-pages
  loadData()               reads content/data/**/*.json
  applyAllRules()          produces PageDefinition[] candidates from 9 page-type rules
  validateCandidates()     applies threshold + overlap rules, marks valid/rejected
  deduplicateCandidates()  rejects duplicate canonical keys and slugs
  buildPageIndex()         writes content/index/page-definitions.json (all candidates)
  buildReport()            writes content/index/page-definition-report.json (summary)
  buildSitePlanSummary()   writes content/index/site-plan-summary.json

compute-graph
  buildEntityGraph()       writes content/index/entity-graph.json (nodes + edges)
  computeRelatedPages()    writes content/index/page-links.json (related pages per page)
  buildTopicalClusters()   groups pages into topical clusters

generate-pages
  renderMarkdown()         generates .md files from valid definitions only
  generateNarrative()      fills LLM prose sections (see LLM Boundary below)

qa-check
  validateAll()            checks slugs, frontmatter, tool counts, graph + link artifacts
```

## File Responsibilities

| File | Single responsibility |
|------|-----------------------|
| `src/lib/loadData.ts` | Read and parse JSON datasets from disk |
| `src/lib/slugify.ts` | Convert strings to URL-safe slugs |
| `src/lib/pageRules.ts` | Compute page candidates and thresholds |
| `src/lib/pageBuilders.ts` | Construct `PageDefinition` objects from rule outputs |
| `src/lib/pageIndex.ts` | Validate, deduplicate, and persist the page-definition index |
| `src/lib/entityGraph.ts` | Build the entity graph (nodes + edges) from the dataset |
| `src/lib/pageLinks.ts` | Compute related pages for cross-linking |
| `src/lib/topicalClusters.ts` | Group pages into topical clusters |
| `src/lib/markdown.ts` | Render a `PageDefinition` to a markdown string |
| `src/lib/llm.ts` | Generate narrative prose (placeholder until real LLM connected) |
| `src/lib/validate.ts` | Check definitions and generated files for correctness |

## Page-Definition Index

The index layer (`content/index/`) sits between data and generation:

1. **page-definitions.json** — all candidates (valid + rejected), each with:
   - `canonicalKey` — semantic identity preventing duplicate meaning
   - `matchedToolIds` / `supportCount` — matched tools
   - `isValid` / `rejectionReason` — threshold validation result
   - `overlapScore` — comparison overlap heuristic (comparisons only)

2. **page-definition-report.json** — summary with:
   - counts by type (candidates / valid / rejected)
   - rejection reasons breakdown
   - warnings summary
   - duplicate key stats

Markdown generation reads the index and only produces pages for valid definitions.

## Page Types

| Type              | Slug Pattern                      | Min Tools |
|-------------------|-----------------------------------|-----------|
| category          | best-{category}-tools             | 3         |
| audience-category | {category}-tools-for-{audience}   | 2         |
| use-case          | tools-for-{use-case}              | 2         |
| audience-use-case | {use-case}-tools-for-{audience}   | 2         |
| feature           | tools-with-{feature}              | 3         |
| pricing           | {tier}-{category}-tools           | 2         |
| alternatives      | alternatives-to-{tool}            | 3 (1+2)   |
| comparison        | {tool-a}-vs-{tool-b}              | 2 + overlap >= 2 |
| tool-detail       | {tool}-review                     | 1         |

## Canonical Keys

The canonical key is the **semantic identity** of a page — separate from its URL slug.

The problem it solves: two different slugs could represent the same page. Without canonical keys the system could generate both `notion-vs-jasper` and `jasper-vs-notion` as separate pages. They mean the same thing, just ordered differently.

The canonical key encodes *what a page is about*, not how it's displayed:

```
category|writing
audience-category|marketers|writing
use-case|blog-writing
comparison|copy-ai|jasper     ← IDs sorted, so order doesn't matter
tool-detail|notion
```

Entity IDs within a key are sorted alphabetically so the same combination always produces the same key regardless of iteration order.

Two layers of uniqueness enforced by `deduplicateCandidates()`:
1. **Canonical key** — prevents semantic duplicates (same meaning, different URL)
2. **Slug** — prevents URL duplicates (safety net for edge cases)

First-seen wins. If a second candidate arrives with an already-seen key, it is marked `isValid: false` and kept in the index as an audit trail — but never rendered.

## LLM Boundary

`src/lib/llm.ts` contains `generateNarrative()`. Page structure is decided entirely by the deterministic pipeline — the LLM only fills in prose sections (`introduction`, `bestFor`, `prosAndCons`, `faq`).

How it behaves:
- **With `ANTHROPIC_API_KEY` set** — calls Claude (Haiku 4.5) with a focused, section-specific prompt built from full `Tool` objects.
- **Without the key** — returns an informative `<!-- LLM_PLACEHOLDER ... -->` comment, so the pipeline runs end-to-end in development without spending tokens.
- **Caching** — each generated section is cached by a SHA-256 key over `section + title + pageType + matchedToolIds`, so unchanged pages are never regenerated.

**Not yet implemented:**
1. Rate limiting / batching — up to ~200 calls per full run (4 sections × ~48 pages).
2. A dry-run mode with cost/token estimation before committing to full generation.

## Local Testing

Run the full pipeline, then start the Next.js dev server:

```bash
pnpm install

pnpm pipeline            # compute-pages → compute-graph → generate-pages → qa-check

pnpm --filter web dev    # start Next.js on http://localhost:3000
```

Open `http://localhost:3000` in your browser. The frontend reads from `content/pages/` — regenerate pages and refresh to see content changes.

To stop the server, press `Ctrl+C` in the terminal running `pnpm --filter web dev`.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `loadData: file not found` | Wrong working directory or missing data file | Run scripts from project root via `pnpm` |
| `page-definitions.json not found` | `generate-pages` or `qa-check` run before `compute-pages` | Run `pnpm compute-pages` first |
| `slugify: input produced an empty slug` | Entity slug field contains only special characters | Fix the slug in the relevant JSON file under `content/data/` |
| QA exits 1 with threshold errors | A page type has fewer tools than `MIN_TOOLS` requires | Add more tools to the dataset or adjust thresholds in `src/lib/pageRules.ts` |
| Rejected candidates in report | Expected — candidates below threshold appear in report | Inspect `page-definition-report.json` for details |
