# Requirements: Programmatic Content Site

**Defined:** 2026-03-10
**Core Value:** A fully automated pipeline that produces high-quality, SEO-targeted pages at scale without manual content authorship.

## v1 Requirements

Requirements for initial release. Maps to build-sequence.md steps 4–12.

### Site Plan

- [ ] **PLAN-01**: `buildSitePlanSummary()` produces `content/index/site-plan-summary.json` with valid pages grouped by pageType, slug listings, counts, and tool coverage stats
- [ ] **PLAN-02**: Site-plan artifact contains no rejected/diagnostic data — valid pages only
- [ ] **PLAN-03**: `pnpm compute-pages` writes both `page-definitions.json` and `site-plan-summary.json`

### Pipeline Integrity

- [ ] **PIPE-01**: `pnpm compute-pages` runs cleanly with zero errors
- [ ] **PIPE-02**: `pnpm generate-pages` runs cleanly with zero errors
- [ ] **PIPE-03**: `pnpm qa-check` runs cleanly with zero errors and zero warnings
- [ ] **PIPE-04**: Stale `.md` files are cleaned before generation (no orphan pages)
- [ ] **PIPE-05**: All path resolution uses `import.meta.url` (no `process.cwd()` bugs)

### Dataset

- [ ] **DATA-01**: Tool dataset expanded beyond 6 seed tools to produce meaningful page coverage
- [ ] **DATA-02**: Taxonomy entities (categories, audiences, use cases, features, pricing tiers) expanded to support non-trivial page combinations
- [ ] **DATA-03**: Each tool entry has complete required fields: id, name, slug, description, tagline, website, categories[], audiences[], useCases[], features[], priceTiers[], alternatives[]
- [ ] **DATA-04**: Dataset produces at least 50 valid page definitions after expansion

### LLM Narratives

- [ ] **LLM-01**: `generateNarrative()` calls Claude API (not placeholder comments) for introduction, bestFor, prosAndCons, and faq sections
- [ ] **LLM-02**: `NarrativeContext` is enriched with full Tool objects (not just matchedToolIds)
- [ ] **LLM-03**: LLM integration includes rate limiting to avoid API throttling
- [ ] **LLM-04**: Generated narrative content is cached — unchanged pages are not re-requested
- [ ] **LLM-05**: LLM never alters page structure, slug, matchedToolIds, or section assignments

### Quality Hardening

- [ ] **QA-01**: QA check detects and reports duplicate semantic pages
- [ ] **QA-02**: QA check flags thin-content pages (pages with below-threshold entity coverage)
- [ ] **QA-03**: `qa-check` exits non-zero on any error condition
- [ ] **QA-04**: `page-definition-report.json` includes actionable rejection reason summaries
- [ ] **QA-05**: `pnpm typecheck` passes with zero errors

### Frontend

- [ ] **FE-01**: `apps/web` application exists and loads markdown pages from `content/pages/`
- [ ] **FE-02**: Valid slugs route to the correct page and render markdown content
- [ ] **FE-03**: Invalid slugs return 404
- [ ] **FE-04**: Each page exposes basic metadata (title, description)
- [ ] **FE-05**: A simple homepage exists listing or linking to available pages
- [ ] **FE-06**: `pnpm --filter web dev` starts local dev server successfully
- [ ] **FE-07**: Frontend never computes page definitions — reads only from `content/pages/`

### Build Verification

- [ ] **BUILD-01**: `pnpm --filter web build` completes successfully
- [ ] **BUILD-02**: Full pipeline runs end-to-end: `compute-pages` → `generate-pages` → `qa-check` → `web build`
- [ ] **BUILD-03**: Generated pages render correctly in local browser

## v2 Requirements

Deferred to future release.

### Build Optimization (step 13–14)

- **OPT-01**: High-priority pages prebuilt at deploy time; lower-priority rendered lazily
- **OPT-02**: Build time does not scale linearly with total page count
- **OPT-03**: Valid slugs resolve correctly regardless of render strategy
- **OPT-04**: Deterministic priority classification for prebuilt vs lazy pages

### Advanced Architecture (steps 15–16)

- **ADV-01**: Entity graph for internal linking intelligence
- **ADV-02**: Related-page computation
- **ADV-03**: Topical cluster groupings
- **ADV-04**: Smarter navigation structures for SEO

## Out of Scope

| Feature | Reason |
|---------|--------|
| Database or background job systems | Static pipeline by design; not needed |
| LLM deciding page structure | Hard architectural boundary — LLM writes prose only |
| Real-time page generation | Batch pipeline; pages generated offline |
| Mobile app | Web-only |
| Auth / user accounts | Content site, no user accounts needed |
| Build-time optimization (hybrid rendering) | Phase 4 — after frontend MVP is proven |
| Advanced SEO architecture (entity graph) | Phase 5 — after site has meaningful page count |

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAN-01 | Phase 1 | Pending |
| PLAN-02 | Phase 1 | Pending |
| PLAN-03 | Phase 1 | Pending |
| PIPE-01 | Phase 2 | Pending |
| PIPE-02 | Phase 2 | Pending |
| PIPE-03 | Phase 2 | Pending |
| PIPE-04 | Phase 2 | Pending |
| PIPE-05 | Phase 2 | Pending |
| DATA-01 | Phase 3 | Pending |
| DATA-02 | Phase 3 | Pending |
| DATA-03 | Phase 3 | Pending |
| DATA-04 | Phase 3 | Pending |
| LLM-01 | Phase 4 | Pending |
| LLM-02 | Phase 4 | Pending |
| LLM-03 | Phase 4 | Pending |
| LLM-04 | Phase 4 | Pending |
| LLM-05 | Phase 4 | Pending |
| QA-01 | Phase 5 | Pending |
| QA-02 | Phase 5 | Pending |
| QA-03 | Phase 5 | Pending |
| QA-04 | Phase 5 | Pending |
| QA-05 | Phase 5 | Pending |
| FE-01 | Phase 6 | Pending |
| FE-02 | Phase 6 | Pending |
| FE-03 | Phase 6 | Pending |
| FE-04 | Phase 6 | Pending |
| FE-05 | Phase 6 | Pending |
| FE-06 | Phase 6 | Pending |
| FE-07 | Phase 6 | Pending |
| BUILD-01 | Phase 7 | Pending |
| BUILD-02 | Phase 7 | Pending |
| BUILD-03 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after initial definition*
