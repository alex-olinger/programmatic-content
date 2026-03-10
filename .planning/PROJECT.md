# Programmatic Content Site

## What This Is

A deterministic content factory that generates SEO-optimized pages from structured data. Given a dataset of AI tools and taxonomy entities, it computes all valid page definitions and renders them as markdown — which a frontend then serves. The content engine decides what pages exist; the frontend decides how they're displayed.

## Core Value

A fully automated pipeline that produces high-quality, SEO-targeted pages at scale without manual content authorship.

## Requirements

### Validated

<!-- Shipped and confirmed. Inferred from existing codebase — phases 1–3 and 5 of build-sequence.md. -->

- ✓ Master scaffold — structured datasets, TypeScript types, generation scripts
- ✓ Refactor / tighten — clean types, naming, abstractions, stable repo structure
- ✓ Page-definition index layer — `compute-pages` → `content/index/page-definitions.json` with 9 page types, validation, deduplication
- ✓ `docs/content-engine-rules.md` — architectural rulebook documenting page types, thresholds, LLM boundary

### Active

<!-- Next in build-sequence.md order: steps 4, 6, then Phase 2 -->

- [ ] Site-Plan Artifact Layer (step 4) — `buildSitePlanSummary()` → `content/index/site-plan-summary.json`; valid pages grouped by type, slug listings, counts, tool coverage stats
- [ ] Bugfix / Audit (step 6) — full pipeline runs cleanly: `compute-pages` → `generate-pages` → `qa-check` with zero errors
- [ ] Dataset Expansion (step 7) — expand tools, categories, audiences, use cases, features, pricing tiers beyond 6 seed tools
- [ ] LLM Narrative Integration (step 8) — real Claude/OpenAI integration in `src/lib/llm.ts` with rate limiting, batching, caching
- [ ] Quality Hardening (step 9) — improved QA reporting, thin content safeguards, trusted production-grade output

### Out of Scope

- Frontend (`apps/web`) — Phase 3 work; content engine must be trusted first (steps 1–9 before step 10)
- Database or background job systems — not needed; pipeline is deterministic and batch-run
- LLM deciding page structure — hard architectural boundary; LLM writes prose only, never alters slugs, matchedToolIds, or sections
- Real-time generation — static pipeline by design

## Context

**Build sequence:** The project follows a strict phase order defined in `docs/build-sequence.md`. Skipping phases introduces premature complexity. Current position: Phase 1 steps 1–3 and 5 complete; step 4 (Site-Plan Artifact) is next.

**Architecture:** 5-layer deterministic pipeline — `content/data/` (JSON) → page definitions → markdown generation → LLM narrative layer → frontend. Frontend has never been built; it's Phase 3.

**Current pipeline state:** 70 page-definition candidates, 48 valid, 22 rejected. 6 seed tools (Notion, Jasper, Copy.ai, Descript, Synthesia, Otter.ai). Pipeline runs via `pnpm compute-pages && pnpm generate-pages && pnpm qa-check`.

**Tech stack:** TypeScript + tsx (no compile step), ESM with `.js` extensions, pnpm, strict mode. No test framework exists yet.

**LLM boundary:** `src/lib/llm.ts` → `generateNarrative()` returns `<!-- LLM_PLACEHOLDER: ... -->` comments. Not yet connected to a real API.

**Key docs:**
- `docs/build-sequence.md` — official phased build order (source of truth for what comes next)
- `docs/content-engine-rules.md` — page type specs, thresholds, validation pipeline, invariants
- `docs/project-map.md` — directory structure and layer responsibilities
- `docs/ai-editing-rules.md` — safety rules for AI modifications

## Constraints

- **Architecture**: Deterministic engine must never involve LLM in structure decisions — slugs, tool matching, page types are always computed
- **Build order**: Follow `docs/build-sequence.md` sequence; content engine must be trusted before frontend is built
- **No infrastructure**: No databases, no background jobs, no servers — keep it a static pipeline
- **Frontend constraint**: `apps/web` must never compute page definitions; it only renders existing generated files

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Page definitions as intermediate artifact | Decouples site plan from generation; allows inspection and validation before content is written | ✓ Good |
| Gitignore generated artifacts | `content/index/` and `content/pages/` are fully reproducible; no point tracking them | ✓ Good |
| LLM writes prose only | Keeps page structure deterministic and reproducible; LLM unreliability can't corrupt site plan | ✓ Good |
| 9 page types with explicit thresholds | Prevents thin/low-quality pages; min-tool requirements ensure pages have enough content | ✓ Good |
| tsx for direct execution | No compile step needed; fast iteration | ✓ Good |
| `.js` extensions in TS imports | Required for tsx ESM resolution | ✓ Good |

---
*Last updated: 2026-03-10 — initialized from existing codebase (phases 1–3, 5 complete)*
