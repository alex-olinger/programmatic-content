# Content Engine Rules --- Programmatic Content Site

This document defines the rules governing how the content engine
computes, validates, and generates pages.

AI assistants and human developers should read this before modifying
`src/lib/pageRules.ts`, `src/lib/pageIndex.ts`, `src/types/pages.ts`,
or any pipeline script.

------------------------------------------------------------------------

# Core Principle

The content engine is a **deterministic rule system**.

Given the same structured data, it must always produce the same page
definitions. No randomness, no inference, no LLM involvement in
structure decisions.

------------------------------------------------------------------------

# Architecture Boundary

```
Deterministic engine decides:          LLM layer generates:
  - which pages exist                    - introduction prose
  - page slugs                           - best-for explanations
  - page types                           - pros and cons
  - matched tool lists                   - FAQ answers
  - entity relationships
  - validation outcomes
```

The LLM layer in `src/lib/llm.ts` receives a fully-formed
`PageDefinition` and writes narrative prose only. It must never alter
page structure, tool lists, slugs, or entity assignments.

------------------------------------------------------------------------

# Page Types

The engine produces 9 page types. Each type has a specific slug pattern,
entity scope, and minimum tool threshold.

## 1. `category`

Slug pattern: `best-{category}-tools`
Example: `best-writing-tools`

Matches tools whose `categories[]` includes the target category.
Minimum tools: 3

## 2. `audience-category`

Slug pattern: `{category}-tools-for-{audience}`
Example: `writing-tools-for-marketers`

Matches tools whose `categories[]` includes the category AND
`audiences[]` includes the audience.
Minimum tools: 2

## 3. `use-case`

Slug pattern: `tools-for-{use-case}`
Example: `tools-for-blog-writing`

Matches tools whose `useCases[]` includes the target use case.
Minimum tools: 2

## 4. `audience-use-case`

Slug pattern: `{use-case}-tools-for-{audience}`
Example: `blog-writing-tools-for-marketers`

Matches tools whose `useCases[]` includes the use case AND
`audiences[]` includes the audience.
Minimum tools: 2

## 5. `feature`

Slug pattern: `tools-with-{feature}`
Example: `tools-with-ai-suggestions`

Matches tools whose `features[]` includes the target feature.
Minimum tools: 3

## 6. `pricing`

Slug pattern: `{price-tier}-{category}-tools`
Example: `freemium-writing-tools`

Matches tools whose `priceTiers[]` includes the tier AND
`categories[]` includes the category.
Minimum tools: 2

## 7. `alternatives`

Slug pattern: `alternatives-to-{tool}`
Example: `alternatives-to-jasper`

Matches tools that are listed in the target tool's `alternatives[]` field
AND share at least one category with the target tool. The target tool
always appears as `matchedToolIds[0]`; alternatives follow.
Minimum tools: 3 (target + at least 2 alternatives)

## 8. `comparison`

Slug pattern: `{tool-a}-vs-{tool-b}` (tools ordered by slug, alphabetically)
Example: `copy-ai-vs-notion`

Pairs two tools that share at least one category AND meaningful attribute
overlap. Pairs are evaluated by `computeOverlapScore()`.
Slug order: alphabetical by tool slug (e.g. `copy-ai` before `notion`).
Canonical key: `comparison|{id-a}|{id-b}` with IDs sorted alphabetically.
Minimum overlap score: 2 (MIN_OVERLAP_SCORE)
Minimum tools: 2 (always exactly the two tools being compared)

Overlap score increments by 1 for each shared: category, audience,
use case, feature.

## 9. `tool-detail`

Slug pattern: `{tool}-review`
Example: `notion-review`

Emitted for every tool in the dataset, regardless of entity coverage.
Minimum tools: 1

------------------------------------------------------------------------

# Minimum Tool Thresholds

Defined in `src/lib/pageRules.ts` as `MIN_TOOLS`:

```
category:          3
audience-category: 2
use-case:          2
audience-use-case: 2
feature:           3
pricing:           2
alternatives:      3   (target + ≥2 alternatives)
comparison:        2   (always exactly 2)
tool-detail:       1   (always exactly 1)
```

Pages that do not meet their threshold are marked `isValid: false`
with `rejectionReason: "below minimum: N tools, need >= M"`.

------------------------------------------------------------------------

# Validation Pipeline

Validation occurs in `src/lib/pageIndex.ts` and is separate from
candidate generation (rules emit all candidates with ≥1 matched tool).

## Step 1 — Threshold check

`validateCandidates()` applies `MIN_TOOLS` and `MIN_OVERLAP_SCORE`.
Candidates that fail are marked invalid with a rejection reason.

## Step 2 — Deduplication

`deduplicateCandidates()` rejects candidates with duplicate
`canonicalKey` or duplicate `slug`. First-seen wins; subsequent
duplicates are marked `isValid: false` with
`rejectionReason: "duplicate canonical key: ..."` or
`rejectionReason: "duplicate slug: ..."`.

## Step 3 — Index build

`buildPageIndex()` assembles the full `PageIndex` object containing
all candidates (valid and invalid) with metadata: totalCandidates,
totalValid, totalRejected, generatedAt.

## Step 4 — QA check

`validateAll()` in `src/lib/validate.ts` performs a final sweep:
- duplicate slugs / IDs / canonical keys
- pages with zero matched tools
- threshold violations (safety net)
- missing generated files
- missing or malformed YAML frontmatter
- missing expected section headings

The `qa-check` script exits with a non-zero code if any errors are found.

------------------------------------------------------------------------

# Canonical Keys

Every `PageDefinition` has a `canonicalKey` that encodes its semantic
identity. Canonical keys prevent duplicate pages with different slugs.

Format by type:

```
category:          "category|{categoryId}"
audience-category: "audience-category|{id1}|{id2}"  (audienceId + categoryId, sorted)
use-case:          "use-case|{useCaseId}"
audience-use-case: "audience-use-case|{id1}|{id2}"  (audienceId + useCaseId, sorted)
feature:           "feature|{featureId}"
pricing:           "pricing|{id1}|{id2}"             (priceTierId + categoryId, sorted)
alternatives:      "alternatives|{toolId}"
comparison:        "comparison|{id1}|{id2}"          (both toolIds, sorted alphabetically)
tool-detail:       "tool-detail|{toolId}"
```

The `audience-category`, `audience-use-case`, `pricing`, and `comparison`
types sort their component IDs alphabetically before joining. This ensures
the same canonical key regardless of entity iteration order.

Example: `comparison|copy-ai|notion` — IDs `copy-ai` and `notion` sorted,
so this is the only valid key even if the pair is encountered as
`notion` vs `copy-ai` or `copy-ai` vs `notion`.

------------------------------------------------------------------------

# Page Sections

Each page type has a defined set of sections. Sections are either
`deterministic` (computed by the engine) or `llm` (prose generated by
the LLM layer).

```
Section name        Type           Present in
introduction        llm            all types
toolList            deterministic  all types
comparisonTable     deterministic  comparison only
bestFor             llm            all types
prosAndCons         llm            tool-detail, comparison
faq                 llm            all types
```

`SectionName` type: `'introduction' | 'toolList' | 'comparisonTable' |
'bestFor' | 'prosAndCons' | 'faq'`

`sections` in `PageDefinition` is `Partial<Record<SectionName, 'deterministic' | 'llm'>>`.

------------------------------------------------------------------------

# LLM Integration (current state)

`src/lib/llm.ts` defines `generateNarrative(section, ctx)`.

Currently returns HTML comment placeholders:
```
<!-- LLM_PLACEHOLDER: {section} for {pageType} — {title} -->
```

Before connecting a real LLM:
- enrich `NarrativeContext` with full `Tool` objects (currently has `matchedToolIds` only)
- add rate limiting and batching
- add caching to avoid regenerating unchanged pages

`NarrativeContext` shape:
```typescript
{
  pageType: PageType
  matchedToolIds: string[]
  entities: { categories, audiences, useCases, features }
  title: string
}
```

------------------------------------------------------------------------

# Rules for Adding New Page Types

If a new page type is needed:

1. Add the type to `PageType` union in `src/types/pages.ts`
2. Add a MIN_TOOLS entry in `pageRules.ts`
3. Write a rule function following the existing pattern:
   - iterate relevant entity combinations
   - filter matched tools
   - emit via `buildPageDefinition()` for each candidate with ≥1 tool
4. Add the rule to `applyAllRules()`
5. Define which sections the type uses in `sectionsFor()` in `pageBuilders.ts`
6. Update this document

------------------------------------------------------------------------

# Rules for Adding New Entities

To add a new entity type (e.g., integrations as a page axis):

1. Add the interface to `entities.ts` and extend `Dataset`
2. Add JSON file to `content/data/taxonomy/`
3. Load it in `loadData.ts`
4. Add corresponding rule function(s) in `pageRules.ts`
5. Extend `Tool` interface if tools need to reference the entity
6. Update this document

------------------------------------------------------------------------

# Rules for Modifying Validation Thresholds

Thresholds in `MIN_TOOLS` and `MIN_OVERLAP_SCORE` are intentional.
Lowering them increases page count but risks thin content.

Before changing a threshold:
1. Check the rejection report (`page-definition-report.json`)
2. Verify the data supports the new threshold
3. Re-run the full pipeline and inspect the resulting pages
4. Update this document if the change is intentional

------------------------------------------------------------------------

# Pipeline Commands

```
pnpm compute-pages    # Stage 1: compute + write page-definitions.json
pnpm generate-pages   # Stage 2: write content/pages/*.md
pnpm qa-check         # Stage 3: validate — exits non-zero on errors
pnpm clean            # Delete content/pages/ and content/index/
```

Run the full pipeline:
```
pnpm compute-pages && pnpm generate-pages && pnpm qa-check
```

------------------------------------------------------------------------

# Key Invariants

These must always be true after a successful pipeline run:

1. Every file in `content/pages/` has a corresponding valid entry in
   `page-definitions.json`
2. Every valid entry in `page-definitions.json` has a corresponding
   file in `content/pages/`
3. No two pages share a slug
4. No two pages share a canonical key
5. All pages have ≥1 matched tool
6. All pages meet their type's MIN_TOOLS threshold
7. Comparison pages have overlap score ≥ MIN_OVERLAP_SCORE
8. All generated files have valid YAML frontmatter
