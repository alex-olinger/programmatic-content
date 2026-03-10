# Phase 1: Site-Plan Artifact - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend `scripts/compute-pages.ts` to write a second JSON artifact — `content/index/site-plan-summary.json` — alongside the existing `page-definitions.json`. The summary contains only valid pages in a consumer-friendly format. No new pipeline behavior, no changes to validation logic, no UI.

</domain>

<decisions>
## Implementation Decisions

### Summary JSON shape
- Top-level structure: `{ generatedAt, totalValidPages, totalPageTypes, byType: { ... } }`
- `byType` keyed by pageType (object, not array) — easy lookup, counts at a glance
- Each pageType entry: `{ count: N, slugs: string[] }` — slugs only, no title/description
- Example: `{ "category": { count: 5, slugs: ["best-writing-tools", ...] }, "comparison": { ... } }`

### Tool coverage stats
- Format: `{ toolId: pageCount }` — page count per tool only (not pageTypes mapping)
- Only tools with at least one valid page are included (zero-coverage tools omitted)
- Tools ordered by page count descending (most-covered first)
- Lives as a `toolCoverage` key at the top level of the summary

### Downstream consumer
- Not fully discussed (context limit hit) — treat as human inspection + future CI use
- Claude's discretion: keep format readable (pretty-printed JSON, 2-space indent)

### Claude's Discretion
- Exact TypeScript interface name for the summary type
- Whether `buildSitePlanSummary()` lives in `pageIndex.ts` or a new file
- Pretty-print formatting details

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard approaches consistent with existing `writePageIndex` / `writeReport` patterns in `src/lib/pageIndex.ts`.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `writePageIndex()` / `writeReport()` in `src/lib/pageIndex.ts`: existing write-to-disk pattern with try/catch — `buildSitePlanSummary()` should follow same pattern
- `PageIndex` / `PageDefinitionReport` in `src/types/pages.ts`: existing artifact type pattern to follow for new `SitePlanSummary` type
- `buildReport()` in `src/lib/pageIndex.ts`: aggregates candidates by type — similar logic needed for summary

### Established Patterns
- All artifacts written via `fs.writeFileSync` with `JSON.stringify(data, null, 2)`
- New types defined in `src/types/pages.ts`, new functions exported from `src/lib/pageIndex.ts`
- `compute-pages.ts` calls build+write functions sequentially — just add `buildSitePlanSummary()` + `writeSitePlanSummary()` calls

### Integration Points
- `scripts/compute-pages.ts`: add call after `writePageIndex()` — pass validated candidates
- `src/lib/pageIndex.ts`: add `buildSitePlanSummary()` + `writeSitePlanSummary()` functions
- `src/types/pages.ts`: add `SitePlanSummary` interface
- `content/index/`: output directory (already created by compute-pages, gitignored)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-site-plan-artifact*
*Context gathered: 2026-03-10*
