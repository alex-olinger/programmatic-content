# Phase 1: Site-Plan Artifact - Research

**Researched:** 2026-03-10
**Domain:** TypeScript/Node.js — internal JSON artifact generation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Summary JSON shape:**
- Top-level structure: `{ generatedAt, totalValidPages, totalPageTypes, byType: { ... } }`
- `byType` keyed by pageType (object, not array) — easy lookup, counts at a glance
- Each pageType entry: `{ count: N, slugs: string[] }` — slugs only, no title/description
- Example: `{ "category": { count: 5, slugs: ["best-writing-tools", ...] }, "comparison": { ... } }`

**Tool coverage stats:**
- Format: `{ toolId: pageCount }` — page count per tool only (not pageTypes mapping)
- Only tools with at least one valid page are included (zero-coverage tools omitted)
- Tools ordered by page count descending (most-covered first)
- Lives as a `toolCoverage` key at the top level of the summary

**Output location:** `content/index/site-plan-summary.json` (written by `pnpm compute-pages`)

**Downstream consumer:** Human inspection + future CI use; keep format readable (pretty-printed JSON, 2-space indent)

### Claude's Discretion
- Exact TypeScript interface name for the summary type
- Whether `buildSitePlanSummary()` lives in `pageIndex.ts` or a new file
- Pretty-print formatting details

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAN-01 | `buildSitePlanSummary()` produces `content/index/site-plan-summary.json` with valid pages grouped by pageType, slug listings, counts, and tool coverage stats | Existing `buildReport()` pattern covers grouping-by-type; `matchedToolIds` on `PageDefinition` provides tool coverage data |
| PLAN-02 | Site-plan artifact contains no rejected/diagnostic data — valid pages only | Filter to `isValid === true` before building; never include `rejectionReason`, `warnings`, or `overlapScore` fields in output |
| PLAN-03 | `pnpm compute-pages` writes both `page-definitions.json` and `site-plan-summary.json` | Add `buildSitePlanSummary()` + `writeSitePlanSummary()` calls in `scripts/compute-pages.ts` after existing write calls |
</phase_requirements>

---

## Summary

This phase adds a single consumer-friendly JSON artifact to the existing `pnpm compute-pages` pipeline. The scope is narrow: one new TypeScript interface, two new functions in `pageIndex.ts`, and two new lines in `compute-pages.ts`. No new dependencies, no schema changes to existing artifacts, no pipeline behavior changes.

The existing codebase provides direct templates for every piece of work. `buildReport()` already groups candidates by type. `writePageIndex()` / `writeReport()` already establish the write-to-disk pattern with error handling. `PageIndex` and `PageDefinitionReport` in `pages.ts` already show the interface pattern to follow.

The only non-trivial logic is tool coverage computation: iterate valid page definitions, collect all `matchedToolIds`, count occurrences, filter zero-count tools, sort descending. This is straightforward array processing.

**Primary recommendation:** Implement entirely within existing files (`src/types/pages.ts` + `src/lib/pageIndex.ts` + `scripts/compute-pages.ts`) — no new files needed.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `fs` | built-in | `writeFileSync` for artifact output | Already used throughout codebase |
| TypeScript | ^5.4.0 | Interface definition, type safety | Project standard (tsx runtime) |
| tsx | ^4.7.0 | Script execution | Project standard, no compile step |

### Supporting

No additional libraries needed. All logic is pure TypeScript over in-memory data structures.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline in `pageIndex.ts` | New `sitePlanSummary.ts` file | New file only worth it if the function grows significantly; at current scope, keeping in `pageIndex.ts` is simpler and consistent |

**Installation:** None required — no new dependencies.

---

## Architecture Patterns

### Recommended Project Structure

No new directories or files needed. Changes are contained to:

```
src/
├── types/
│   └── pages.ts          # add SitePlanSummary interface
└── lib/
    └── pageIndex.ts      # add buildSitePlanSummary() + writeSitePlanSummary()
scripts/
└── compute-pages.ts      # add 2 calls after writeReport()
content/index/            # already created by compute-pages; new file lands here
```

### Pattern 1: Build + Write Separation

**What:** Each artifact has a separate `build*()` function (pure, returns typed object) and a `write*()` function (I/O, handles errors).

**When to use:** Always — this is the established pattern for all artifacts in this codebase.

**Example** (from existing `pageIndex.ts`):
```typescript
// Build (pure)
export function buildReport(candidates: PageDefinition[], duplicateKeysRemoved: number): PageDefinitionReport {
  // ... pure computation
  return { generatedAt: new Date().toISOString(), ... };
}

// Write (I/O with error handling)
export function writeReport(filePath: string, report: PageDefinitionReport): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  } catch (err) {
    throw new Error(`writeReport: failed to write "${filePath}": ${err instanceof Error ? err.message : String(err)}`);
  }
}
```

### Pattern 2: Type Definition in `pages.ts`

**What:** All artifact types live in `src/types/pages.ts`, exported for use by both library code and scripts.

**When to use:** Any new artifact type. Keeps types co-located and importable via the same module path.

### Pattern 3: Tool Coverage Computation

**What:** Build a frequency map from `matchedToolIds` across all valid page definitions, sort by count descending.

**Example:**
```typescript
// Source: derived from existing PageDefinition shape in pages.ts
const toolCounts: Record<string, number> = {};
for (const page of validPages) {
  for (const toolId of page.matchedToolIds) {
    toolCounts[toolId] = (toolCounts[toolId] ?? 0) + 1;
  }
}
// Sort descending, omit zero-count tools (naturally handled — only seen toolIds present)
const toolCoverage = Object.fromEntries(
  Object.entries(toolCounts).sort((a, b) => b[1] - a[1])
);
```

### Anti-Patterns to Avoid

- **Including rejected data in summary:** The summary must filter to `isValid === true` first — never pass raw `candidates` to `buildSitePlanSummary()`.
- **Using `process.cwd()` for path resolution:** All path resolution uses `import.meta.url`. The `SUMMARY_FILE` constant in `compute-pages.ts` must follow the same `path.join(INDEX_DIR, 'site-plan-summary.json')` pattern.
- **Calling `new Date().toISOString()` twice:** Build and write are called at different moments; pass `generatedAt` from `buildSitePlanSummary()` — don't re-generate in the write function.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON pretty-printing | Custom formatter | `JSON.stringify(data, null, 2)` | Built-in, already used for all other artifacts |
| Sorted object entries | Custom sort utility | `Object.entries(...).sort(...)` then `Object.fromEntries(...)` | One-liner, no library needed |
| File path construction | Custom path builder | `path.join(INDEX_DIR, 'site-plan-summary.json')` | Existing pattern in `compute-pages.ts` |

**Key insight:** This phase requires zero new abstractions. Every building block exists in the codebase already.

---

## Common Pitfalls

### Pitfall 1: Passing Non-Valid Pages to buildSitePlanSummary

**What goes wrong:** Summary includes rejected page slugs under pageType buckets, violating PLAN-02.

**Why it happens:** Forgetting to pre-filter before calling the build function, or passing `candidates` instead of `valid`.

**How to avoid:** `buildSitePlanSummary()` should accept `PageDefinition[]` and internally assert/filter `isValid === true`, OR the caller pre-filters and passes only valid pages. Either approach works — the internal-filter approach is safer.

**Warning signs:** `totalValidPages` in summary does not match `totalValid` in `page-definitions.json`.

### Pitfall 2: `totalPageTypes` Off-by-One

**What goes wrong:** `totalPageTypes` counts entries in `byType` but some page types may have zero valid pages and should be omitted entirely.

**Why it happens:** Iterating all `PageType` enum values rather than only types that appear in valid pages.

**How to avoid:** Derive `totalPageTypes` as `Object.keys(byType).length` after building the `byType` map from actual valid pages — don't enumerate the full `PageType` union.

### Pitfall 3: Tool Coverage Includes Tools with Zero Valid Pages

**What goes wrong:** A tool appears in `toolCoverage` with count 0, contradicting the locked decision to omit zero-coverage tools.

**Why it happens:** Pre-populating the `toolCounts` map from the full tool dataset rather than deriving it from valid page definitions.

**How to avoid:** Build `toolCoverage` only from `matchedToolIds` of valid pages — don't start from the tool dataset.

### Pitfall 4: Import Not Added to compute-pages.ts

**What goes wrong:** TypeScript compilation error — `buildSitePlanSummary` / `writeSitePlanSummary` not found.

**Why it happens:** Adding functions to `pageIndex.ts` but forgetting to update the import destructuring in `compute-pages.ts`.

**How to avoid:** Verify the import line in `compute-pages.ts` after adding new exports to `pageIndex.ts`.

---

## Code Examples

### SitePlanSummary Interface

```typescript
// Source: pattern from existing PageIndex / PageDefinitionReport in src/types/pages.ts
export interface SitePlanSummary {
  generatedAt: string;
  totalValidPages: number;
  totalPageTypes: number;
  byType: Record<string, { count: number; slugs: string[] }>;
  toolCoverage: Record<string, number>;
}
```

### buildSitePlanSummary

```typescript
// Source: derived from buildReport() pattern in src/lib/pageIndex.ts
export function buildSitePlanSummary(candidates: PageDefinition[]): SitePlanSummary {
  const validPages = candidates.filter((d) => d.isValid);

  // Group by pageType
  const byType: Record<string, { count: number; slugs: string[] }> = {};
  for (const page of validPages) {
    if (!byType[page.pageType]) {
      byType[page.pageType] = { count: 0, slugs: [] };
    }
    byType[page.pageType].count++;
    byType[page.pageType].slugs.push(page.slug);
  }

  // Tool coverage: count pages per toolId, sort descending
  const toolCounts: Record<string, number> = {};
  for (const page of validPages) {
    for (const toolId of page.matchedToolIds) {
      toolCounts[toolId] = (toolCounts[toolId] ?? 0) + 1;
    }
  }
  const toolCoverage = Object.fromEntries(
    Object.entries(toolCounts).sort((a, b) => b[1] - a[1])
  );

  return {
    generatedAt: new Date().toISOString(),
    totalValidPages: validPages.length,
    totalPageTypes: Object.keys(byType).length,
    byType,
    toolCoverage,
  };
}
```

### writeSitePlanSummary

```typescript
// Source: writeReport() pattern in src/lib/pageIndex.ts
export function writeSitePlanSummary(filePath: string, summary: SitePlanSummary): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(summary, null, 2));
  } catch (err) {
    throw new Error(
      `writeSitePlanSummary: failed to write "${filePath}": ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
```

### compute-pages.ts integration

```typescript
// Source: existing pattern in scripts/compute-pages.ts
const SUMMARY_FILE = path.join(INDEX_DIR, 'site-plan-summary.json');

// After writeReport():
const summary = buildSitePlanSummary(candidates);
writeSitePlanSummary(SUMMARY_FILE, summary);
console.log(`Wrote: ${SUMMARY_FILE}`);
```

---

## State of the Art

No external libraries or frameworks involved — this is pure in-project TypeScript work. No ecosystem state-of-the-art considerations apply.

---

## Open Questions

1. **Should `byType` slugs be sorted alphabetically?**
   - What we know: Locked decision specifies `slugs: string[]` with no ordering requirement
   - What's unclear: Human readability is served by alphabetical order; insertion order is simpler
   - Recommendation: Sort alphabetically within each pageType bucket — trivially done with `.sort()` and improves human-inspection value without changing structure

2. **Should `buildSitePlanSummary()` live in `pageIndex.ts` or a dedicated file?**
   - What we know: Left to Claude's discretion; current phase has only 2 new functions
   - What's unclear: Future growth (will more summary functions accumulate here?)
   - Recommendation: Keep in `pageIndex.ts` — the file is not large (200 lines) and the new functions are logically related to the existing index-building work

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json`, so this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test framework installed |
| Config file | None — see Wave 0 |
| Quick run command | `pnpm typecheck` (zero test framework available; typecheck is the closest proxy) |
| Full suite command | `pnpm typecheck && pnpm compute-pages` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAN-01 | `buildSitePlanSummary()` produces correct JSON structure with byType, slugs, counts, toolCoverage | unit | `pnpm typecheck` (structural) + `pnpm compute-pages` (smoke) | ❌ Wave 0 |
| PLAN-02 | Summary contains only valid pages — no rejected/diagnostic data | smoke | `pnpm compute-pages` then inspect `content/index/site-plan-summary.json` | ❌ Wave 0 |
| PLAN-03 | Both `page-definitions.json` and `site-plan-summary.json` written on `pnpm compute-pages` | smoke | `pnpm compute-pages` | ❌ Wave 0 |

**Note:** No test runner (Jest, Vitest, etc.) is installed. The project uses `tsx` scripts only. Validation relies on TypeScript compilation (`pnpm typecheck`) and smoke-testing the pipeline (`pnpm compute-pages`).

### Sampling Rate

- **Per task commit:** `pnpm typecheck`
- **Per wave merge:** `pnpm typecheck && pnpm compute-pages`
- **Phase gate:** `pnpm typecheck && pnpm pipeline` green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] No automated unit test file exists for `buildSitePlanSummary()` — manual verification via `pnpm compute-pages` and JSON inspection is the fallback
- [ ] No test framework installed — if unit tests are desired, Wave 0 must install and configure (e.g., `vitest`)
- [ ] Smoke test script: verify `content/index/site-plan-summary.json` exists and passes basic shape checks after `pnpm compute-pages`

**Recommendation:** Given phase scope (2 functions, ~40 lines), the overhead of installing a test framework is disproportionate. Validate via `pnpm typecheck` + `pnpm compute-pages` + manual JSON inspection. Add a framework in a dedicated quality-hardening phase if needed.

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection: `src/lib/pageIndex.ts` — build/write patterns, all function signatures
- Direct codebase inspection: `src/types/pages.ts` — interface patterns, `PageDefinition` shape
- Direct codebase inspection: `scripts/compute-pages.ts` — integration point, path resolution pattern
- Direct codebase inspection: `package.json` — scripts, dependencies, no test framework present

### Secondary (MEDIUM confidence)

- Project CONTEXT.md (`01-CONTEXT.md`) — locked decisions on JSON shape and tool coverage format
- Project REQUIREMENTS.md — PLAN-01, PLAN-02, PLAN-03 requirement text

### Tertiary (LOW confidence)

None — all findings are from direct codebase inspection or locked decisions.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; existing stack fully verified from package.json
- Architecture: HIGH — exact integration points identified from codebase; patterns are established and consistent
- Pitfalls: HIGH — derived from direct code inspection and locked decisions

**Research date:** 2026-03-10
**Valid until:** Stable indefinitely (internal project; no external library dependencies)
