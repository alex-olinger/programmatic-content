# Code Walkthrough — PageDefinition to PageIndex

This document traces the exact path a page travels from raw candidate
emission through validation, deduplication, and assembly into the final
`PageIndex` artifact.

All code lives in `scripts/compute-pages.ts`, `src/lib/pageRules.ts`,
`src/lib/pageBuilders.ts`, and `src/lib/pageIndex.ts`.

------------------------------------------------------------------------

# Overview

```
applyAllRules(dataset)          → PageDefinition[]   raw candidates, all isValid=true
validateCandidates(candidates)  → PageDefinition[]   thresholds + overlap applied
deduplicateCandidates(validated)→ PageDefinition[]   canonical key + slug dedup
buildPageIndex(candidates)      → PageIndex          envelope with counts + all pages
buildReport(candidates, ...)    → PageDefinitionReport  human-readable summary
```

All candidates — valid and invalid — travel through every step and
remain in the final `PageIndex.pages[]` array. `isValid` is the flag
that downstream consumers (generate-pages, qa-check) use to filter.

------------------------------------------------------------------------

# Step 1 — Candidate Emission (`applyAllRules`)

**File:** `src/lib/pageRules.ts`

`applyAllRules(dataset)` calls all 9 rule functions and concatenates
their results:

```typescript
export function applyAllRules(dataset: Dataset): PageDefinition[] {
  return [
    ...categoryPages(dataset),
    ...audienceCategoryPages(dataset),
    ...useCasePages(dataset),
    ...audienceUseCasePages(dataset),
    ...featurePages(dataset),
    ...pricingPages(dataset),
    ...alternativesPages(dataset),
    ...comparisonPages(dataset),
    ...toolDetailPages(dataset),
  ];
}
```

Each rule function:
1. Iterates its entity space (one or two nested loops)
2. Filters `dataset.tools` by relevant attributes
3. Skips any combination that matches **zero tools** (`if (tools.length < 1) return []`)
4. Calls `buildPageDefinition()` for each qualifying combination

**Key invariant at this stage:** every emitted candidate has
`matchedToolIds.length >= 1`. Rules do not apply `MIN_TOOLS` — that is
validation's job.

**Exception — `toolDetailPages`:** this rule runs an extra check for
incomplete tool data (missing name, description, categories, or website)
and pre-marks those candidates `isValid: false` with a rejection reason.
This is the only case where a rule sets `isValid` to false directly.

------------------------------------------------------------------------

# Step 2 — Building a Candidate (`buildPageDefinition`)

**File:** `src/lib/pageBuilders.ts`

Every rule delegates object construction to `buildPageDefinition()`.
This function assembles the full `PageDefinition` shape from the rule's
parameters:

```typescript
export function buildPageDefinition(params): PageDefinition {
  return {
    id: `${params.pageType}:${params.slug}`,
    slug: params.slug,
    pageType: params.pageType,
    title: params.title,
    description: params.description,
    canonicalKey: params.canonicalKey,
    sourceRule: params.pageType,
    entities: {
      categories: params.categories ?? [],
      audiences:  params.audiences  ?? [],
      useCases:   params.useCases   ?? [],
      features:   params.features   ?? [],
      priceTiers: params.priceTiers ?? [],
    },
    matchedToolIds: params.matchedToolIds,
    supportCount:   params.matchedToolIds.length,  // derived
    sections:       sectionsFor(params.pageType),   // derived
    isValid:        params.isValid ?? true,         // default true
    warnings:       params.warnings ?? [],
    rejectionReason: params.rejectionReason,
    overlapScore:   params.overlapScore,
  };
}
```

Derived fields computed here:
- `id` — `"{pageType}:{slug}"`, e.g. `"category:best-writing-tools"`
- `supportCount` — `matchedToolIds.length` (snapshot; not recomputed later)
- `sections` — from `sectionsFor(pageType)` which returns the correct
  `{ sectionName: 'deterministic' | 'llm' }` map for the type

`sectionsFor` returns:
- **comparison:** introduction(llm), toolList(det), comparisonTable(det), bestFor(llm), prosAndCons(llm), faq(llm)
- **tool-detail:** introduction(llm), toolList(det), bestFor(llm), prosAndCons(llm), faq(llm)
- **all others:** introduction(llm), toolList(det), bestFor(llm), faq(llm)

------------------------------------------------------------------------

# Step 3 — Threshold + Overlap Validation (`validateCandidates`)

**File:** `src/lib/pageIndex.ts`

This is the first mutation pass. It maps over every candidate and
returns a new array with `isValid` and `warnings` potentially updated.

```typescript
export function validateCandidates(candidates: PageDefinition[]): PageDefinition[] {
  return candidates.map((def) => {
    if (!def.isValid) return def;           // already rejected — preserve

    const minTools = MIN_TOOLS[def.pageType];
    if (def.supportCount < minTools) {
      return { ...def, isValid: false,
        rejectionReason: `below minimum: ${def.supportCount} tools, need >= ${minTools}` };
    }

    if (def.pageType === 'comparison' && def.overlapScore !== undefined) {
      if (def.overlapScore < MIN_OVERLAP_SCORE) {
        return { ...def, isValid: false,
          rejectionReason: `insufficient overlap: score ${def.overlapScore}, need >= ${MIN_OVERLAP_SCORE}` };
      }
      if (def.overlapScore === MIN_OVERLAP_SCORE) {
        return { ...def,
          warnings: [...def.warnings, `borderline overlap score: ${def.overlapScore}`] };
      }
    }

    if (def.supportCount === minTools && minTools > 1) {
      return { ...def,
        warnings: [...def.warnings, `supportCount at minimum threshold (${minTools})`] };
    }

    return def;
  });
}
```

Decision tree per candidate:

```
already invalid?          → pass through unchanged
supportCount < MIN_TOOLS? → mark invalid, set rejectionReason
comparison + overlapScore < MIN_OVERLAP_SCORE? → mark invalid
comparison + overlapScore == MIN_OVERLAP_SCORE? → stay valid, add warning
supportCount == MIN_TOOLS (and MIN_TOOLS > 1)? → stay valid, add warning
otherwise                 → pass through unchanged
```

Note: validation never removes candidates from the array. It only
mutates `isValid`, `rejectionReason`, and `warnings` via spread copies.

------------------------------------------------------------------------

# Step 4 — Deduplication (`deduplicateCandidates`)

**File:** `src/lib/pageIndex.ts`

This pass eliminates semantic duplicates using two sets: one for
canonical keys, one for slugs.

```typescript
export function deduplicateCandidates(candidates) {
  const seenKeys  = new Set<string>();
  const seenSlugs = new Set<string>();
  let duplicateKeysRemoved = 0;

  const result = candidates.map((def) => {
    if (seenKeys.has(def.canonicalKey)) {
      duplicateKeysRemoved++;
      return { ...def, isValid: false,
        rejectionReason: `duplicate canonical key: ${def.canonicalKey}` };
    }
    seenKeys.add(def.canonicalKey);

    if (seenSlugs.has(def.slug)) {
      return { ...def, isValid: false,
        rejectionReason: `duplicate slug: ${def.slug}`,
        warnings: [...def.warnings, 'slug collision with another page definition'] };
    }
    seenSlugs.add(def.slug);

    return def;
  });

  return { result, duplicateKeysRemoved };
}
```

**First-seen wins.** The order of candidates from `applyAllRules` is
therefore deterministic and meaningful — if two entries share a key,
whichever appears first in the concatenated array survives.

Canonical key deduplication is the primary guard. It handles the
comparison case: `notion-vs-jasper` and `jasper-vs-notion` have
identical canonical keys (`comparison|jasper|notion`, IDs sorted
alphabetically), so the second pairing is never emitted by the rule
function in the first place — but if it were, this step would catch it.

Slug deduplication is a safety net for cases where different entity
combinations produce the same URL path (e.g., a category and an
audience-category somehow generating the same slug string).

The function returns `{ result, duplicateKeysRemoved }` — the count is
used in the report but not to filter; all duplicates remain in the
array marked invalid.

------------------------------------------------------------------------

# Step 5 — Index Assembly (`buildPageIndex`)

**File:** `src/lib/pageIndex.ts`

After deduplication the candidates array is final. `buildPageIndex`
wraps it in the `PageIndex` envelope:

```typescript
export function buildPageIndex(candidates: PageDefinition[]): PageIndex {
  const valid    = candidates.filter((d) =>  d.isValid);
  const rejected = candidates.filter((d) => !d.isValid);
  return {
    generatedAt:      new Date().toISOString(),
    totalCandidates:  candidates.length,
    totalValid:       valid.length,
    totalRejected:    rejected.length,
    pages:            candidates,          // ALL candidates, valid and invalid
  };
}
```

`PageIndex.pages` contains everything. Consumers that only want valid
pages must filter: `pages.filter(p => p.isValid)`.

------------------------------------------------------------------------

# Step 6 — Report Assembly (`buildReport`)

**File:** `src/lib/pageIndex.ts`

`buildReport` produces a human-readable summary independently of the
index. It is not embedded in `PageIndex` — it is written to a separate
file (`page-definition-report.json`).

The report captures:
- `byType` — per-type counts of candidates / valid / rejected
- `rejectionsByReason` — tally of each unique rejection reason string
- `warningsSummary` — deduplicated set of `[slug] warning message` strings
- `duplicateKeysRemoved` — the count from deduplication

------------------------------------------------------------------------

# Step 7 — Persist to Disk

**File:** `scripts/compute-pages.ts`

```typescript
fs.mkdirSync(INDEX_DIR, { recursive: true });
writePageIndex(INDEX_FILE, index);    // content/index/page-definitions.json
writeReport(REPORT_FILE, report);     // content/index/page-definition-report.json
```

Both files are written as pretty-printed JSON (`JSON.stringify(x, null, 2)`).
The index directory is created if it does not exist.

------------------------------------------------------------------------

# Full Call Sequence in `compute-pages.ts`

```typescript
const dataset        = loadData(CONTENT_ROOT);
const rawCandidates  = applyAllRules(dataset);           // 70 raw
const validated      = validateCandidates(rawCandidates);
const { result: candidates, duplicateKeysRemoved }
                     = deduplicateCandidates(validated);  // 48 valid, 22 rejected
const index          = buildPageIndex(candidates);
const report         = buildReport(candidates, duplicateKeysRemoved);
writePageIndex(INDEX_FILE, index);
writeReport(REPORT_FILE, report);
```

------------------------------------------------------------------------

# State of a `PageDefinition` at Each Stage

| Field            | After emission         | After validateCandidates     | After deduplicateCandidates |
|------------------|------------------------|------------------------------|-----------------------------|
| `isValid`        | `true` (or `false` for incomplete tool-detail) | may flip to `false` | may flip to `false` |
| `rejectionReason`| `undefined` or set by toolDetailPages | set if below threshold / overlap | set if duplicate |
| `warnings`       | `[]`                   | may gain threshold/overlap warnings | may gain slug collision warning |
| `supportCount`   | set, never changes     | read-only                    | read-only                   |
| `matchedToolIds` | set, never changes     | read-only                    | read-only                   |

No other fields change after `buildPageDefinition()` sets them.

------------------------------------------------------------------------

# What `PageIndex.pages` Contains

The `pages` array in the written JSON contains **all** candidates —
valid and rejected — in the order they were produced by `applyAllRules`.

This is intentional. The index is an audit log as much as a site plan.
Inspecting it tells you:

- Which pages exist and are renderable (`isValid: true`)
- Which candidates were considered and why they were rejected
- Where borderline pages live (those with warnings)

Downstream consumers:

| Consumer             | Filter applied              |
|----------------------|-----------------------------|
| `generate-pages.ts`  | `pages.filter(p => p.isValid)` |
| `qa-check.ts`        | `pages.filter(p => p.isValid)` for file checks |
| `apps/web/` (future) | reads only valid slugs for routing |

------------------------------------------------------------------------

# Rejection Reason Taxonomy

These are the possible `rejectionReason` strings in the current system:

| Reason pattern                                        | Set by                    |
|-------------------------------------------------------|---------------------------|
| `"incomplete tool data (missing name, ...)"`          | `toolDetailPages()` rule  |
| `"below minimum: N tools, need >= M"`                 | `validateCandidates()`    |
| `"insufficient overlap: score N, need >= M"`          | `validateCandidates()`    |
| `"duplicate canonical key: comparison|...|..."`       | `deduplicateCandidates()` |
| `"duplicate slug: {slug}"`                            | `deduplicateCandidates()` |
