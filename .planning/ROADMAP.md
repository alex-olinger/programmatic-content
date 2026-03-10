# Roadmap: Programmatic Content Site

## Overview

Starting from a working page-definition index layer, this roadmap completes the content factory: adding the site-plan artifact, hardening the pipeline to zero errors, expanding the dataset to meaningful scale, integrating real LLM narrative generation, hardening quality checks, building the frontend, and proving the full end-to-end pipeline works. Each phase delivers a coherent, independently verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Site-Plan Artifact** - Add `buildSitePlanSummary()` to produce `content/index/site-plan-summary.json`
- [ ] **Phase 2: Pipeline Integrity** - Full pipeline runs cleanly with zero errors and zero warnings
- [ ] **Phase 3: Dataset Expansion** - Expand tools and taxonomy entities to produce meaningful page coverage
- [ ] **Phase 4: LLM Narrative Integration** - Connect real Claude API with rate limiting and caching
- [ ] **Phase 5: Quality Hardening** - QA detects duplicates, thin content, and types pass cleanly
- [ ] **Phase 6: Frontend** - `apps/web` serves generated pages with routing and 404 handling
- [ ] **Phase 7: Build Verification** - Full pipeline proven end-to-end in browser

## Phase Details

### Phase 1: Site-Plan Artifact
**Goal**: The compute-pages script produces a clean, consumer-friendly site-plan summary alongside the full page-definitions index
**Depends on**: Nothing (existing codebase is the foundation)
**Requirements**: PLAN-01, PLAN-02, PLAN-03
**Success Criteria** (what must be TRUE):
  1. Running `pnpm compute-pages` writes `content/index/site-plan-summary.json` alongside `page-definitions.json`
  2. `site-plan-summary.json` contains valid pages grouped by pageType with slug listings and counts
  3. `site-plan-summary.json` contains zero rejected or diagnostic data — only valid pages
  4. Tool coverage stats are present in the summary (which tools appear in how many pages)
**Plans**: 1 plan

Plans:
- [ ] 01-01-PLAN.md — Define SitePlanSummary type, implement build+write functions, wire into compute-pages

### Phase 2: Pipeline Integrity
**Goal**: The full three-script pipeline runs cleanly with zero errors and zero warnings on the current dataset
**Depends on**: Phase 1
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05
**Success Criteria** (what must be TRUE):
  1. `pnpm compute-pages` exits with code 0 and no error output
  2. `pnpm generate-pages` exits with code 0, writes only valid pages, and deletes stale `.md` files first
  3. `pnpm qa-check` exits with code 0 and reports zero errors and zero warnings
  4. All scripts resolve paths via `import.meta.url` — no `process.cwd()` calls remain
**Plans**: TBD

### Phase 3: Dataset Expansion
**Goal**: The tool dataset and taxonomy entities are expanded enough to produce a non-trivial, representative set of valid page definitions
**Depends on**: Phase 2
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. Tool dataset contains more than 6 tools with all required fields populated (id, name, slug, description, tagline, website, categories, audiences, useCases, features, priceTiers, alternatives)
  2. Taxonomy entities (categories, audiences, use cases, features, pricing tiers) cover enough combinations to generate non-trivial page diversity
  3. `pnpm compute-pages` produces at least 50 valid page definitions after expansion
  4. Pipeline still runs clean with zero errors on the expanded dataset
**Plans**: TBD

### Phase 4: LLM Narrative Integration
**Goal**: Generated markdown pages contain real narrative prose from the Claude API, not placeholder comments
**Depends on**: Phase 3
**Requirements**: LLM-01, LLM-02, LLM-03, LLM-04, LLM-05
**Success Criteria** (what must be TRUE):
  1. Opening a generated `.md` file shows real prose in introduction, bestFor, prosAndCons, and faq sections — no `<!-- LLM_PLACEHOLDER -->` comments
  2. Re-running `pnpm generate-pages` on unchanged pages does not make new API calls (cache hit)
  3. Running `pnpm generate-pages` on a large batch does not trigger API rate limit errors
  4. Page slugs, matchedToolIds, and section structure in generated files are identical before and after LLM integration (LLM wrote prose only)
**Plans**: TBD

### Phase 5: Quality Hardening
**Goal**: The QA check reliably catches duplicate pages, thin content, and type errors before they reach the frontend
**Depends on**: Phase 4
**Requirements**: QA-01, QA-02, QA-03, QA-04, QA-05
**Success Criteria** (what must be TRUE):
  1. Introducing a deliberate duplicate semantic page causes `pnpm qa-check` to report it and exit non-zero
  2. Introducing a page below entity-coverage threshold causes `pnpm qa-check` to flag it as thin content
  3. `pnpm typecheck` passes with zero errors on the full codebase
  4. `page-definition-report.json` lists rejection reasons in a human-readable, actionable format
**Plans**: TBD

### Phase 6: Frontend
**Goal**: A browser-accessible site renders the generated markdown pages with correct routing and 404 handling
**Depends on**: Phase 5
**Requirements**: FE-01, FE-02, FE-03, FE-04, FE-05, FE-06, FE-07
**Success Criteria** (what must be TRUE):
  1. `pnpm --filter web dev` starts without errors and serves a homepage that links to available pages
  2. Navigating to a valid slug in the browser renders the page's markdown content with correct title and description metadata
  3. Navigating to a non-existent slug returns a 404 response (not a blank page or crash)
  4. Frontend source contains no page-definition computation — it reads only from `content/pages/`
**Plans**: TBD

### Phase 7: Build Verification
**Goal**: The complete pipeline from raw data to browser-rendered page is proven to work end-to-end
**Depends on**: Phase 6
**Requirements**: BUILD-01, BUILD-02, BUILD-03
**Success Criteria** (what must be TRUE):
  1. `pnpm --filter web build` completes without errors
  2. Running the full sequence `compute-pages → generate-pages → qa-check → web build` exits with code 0 at every step
  3. Opening a built page in a local browser shows rendered content correctly
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Site-Plan Artifact | 0/1 | Not started | - |
| 2. Pipeline Integrity | 0/TBD | Not started | - |
| 3. Dataset Expansion | 0/TBD | Not started | - |
| 4. LLM Narrative Integration | 0/TBD | Not started | - |
| 5. Quality Hardening | 0/TBD | Not started | - |
| 6. Frontend | 0/TBD | Not started | - |
| 7. Build Verification | 0/TBD | Not started | - |
