# Programmatic Content Site

A deterministic content factory: structured JSON datasets → computed page definitions → page-definition index → generated markdown files → frontend rendering.

## Architecture

```
content/data/        Structured datasets (source of truth)
content/index/       Page-definition index + report (computed, gitignored)
content/pages/       Generated markdown pages (gitignored)
src/lib/             Engine libraries
src/types/           TypeScript types
scripts/             Pipeline scripts
apps/web/            Frontend render layer (Phase 3)
docs/                Architecture documentation
```

## Workflow

```bash
pnpm install

pnpm compute-pages    # data → page-definitions.json + report
pnpm generate-pages   # valid definitions → content/pages/*.md
pnpm qa-check         # validate definitions + generated files

pnpm clean            # remove generated artifacts
```

## Pipeline

```
loadData()               reads content/data/**/*.json
applyAllRules()          produces PageDefinition[] candidates from 9 page-type rules
validateCandidates()     applies threshold + overlap rules, marks valid/rejected
deduplicateCandidates()  rejects duplicate canonical keys and slugs
buildPageIndex()         writes content/index/page-definitions.json (all candidates)
buildReport()            writes content/index/page-definition-report.json (summary)
renderMarkdown()         generates .md files from valid definitions only
validateAll()            checks slugs, frontmatter, tool counts on valid pages
```

## File Responsibilities

| File | Single responsibility |
|------|-----------------------|
| `src/lib/loadData.ts` | Read and parse JSON datasets from disk |
| `src/lib/slugify.ts` | Convert strings to URL-safe slugs |
| `src/lib/pageRules.ts` | Compute page candidates and thresholds |
| `src/lib/pageBuilders.ts` | Construct `PageDefinition` objects from rule outputs |
| `src/lib/pageIndex.ts` | Validate, deduplicate, and persist the page-definition index |
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

`src/lib/llm.ts` contains `generateNarrative()`. Currently returns placeholder comments. Page structure is decided entirely by the deterministic pipeline — the LLM only fills in prose sections.

**Before plugging in a real LLM:**
1. Enrich `NarrativeContext` — pass full `Tool` objects (name, description, tagline, website) not just IDs, so prompts have meaningful content.
2. Replace `generateNarrative()` in `src/lib/llm.ts` with a real API call. The function signature is already correct.
3. Add rate limiting / batching — up to ~200 calls per full run (4–6 sections × 48 pages).
4. Add a dry-run mode with cost/token estimation before committing to full generation.
5. Cache generated narratives to avoid re-generating unchanged pages.

## Local Testing

Run the full pipeline, then start the Next.js dev server:

```bash
pnpm install

pnpm compute-pages       # compute page-definitions.json
pnpm generate-pages      # generate content/pages/*.md
pnpm qa-check            # validate output (optional but recommended)

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
