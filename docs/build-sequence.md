# Programmatic Content Site --- Build Sequence

This document defines the **official build order** for the programmatic
content site architecture.

Future development (human or AI-assisted) should follow this sequence to
avoid introducing architectural complexity too early.

The system is intentionally built in layers:

content engine → hardened generator → frontend rendering → deployment
optimization → advanced architecture

Skipping or reordering phases may introduce instability or unnecessary
complexity.

------------------------------------------------------------------------

# Phase 1 --- Content Engine Foundation

Goal: create the deterministic content-generation system.

## 1. Master Scaffold [COMPLETE]

Create the initial content engine architecture.

Expected outputs:

content/ data/ templates/ pages/

scripts/ src/ lib/ types/

Responsibilities:

-   structured datasets
-   markdown templates
-   generation scripts
-   base TypeScript types

------------------------------------------------------------------------

## 2. Refactor / Tighten [COMPLETE]

Immediately clean up the scaffold.

Goals:

-   improve types
-   improve naming
-   remove weak abstractions
-   simplify script interfaces
-   stabilize repo structure

------------------------------------------------------------------------

## 3. Page-Definition Index Layer [COMPLETE]

Add a structured page-definition computation step.

Instead of generating pages directly, the system should:

compute page definitions → store them → generate pages from that
registry

Expected artifact:

content/index/page-definitions.json

This becomes the **page registry layer**.

------------------------------------------------------------------------

## 4. Site-Plan Artifact Layer

Elevate the page-definition index into the canonical **site plan**.

Artifacts:

content/index/page-definitions.json content/index/site-plan-summary.json

Purpose:

-   define all allowed pages
-   inspect site structure before generation
-   prevent accidental page explosion

------------------------------------------------------------------------

## 5. Create `docs/content-engine-rules.md` [COMPLETE]

Generate a repository rulebook documenting:

-   architecture boundaries
-   deterministic vs LLM responsibilities
-   page-family definitions
-   generation rules
-   quality expectations

This file acts as **architectural guardrails for future AI edits**.

------------------------------------------------------------------------

## 6. Bugfix / Audit

Audit the engine once the architecture exists.

Fix:

-   path errors
-   weak assumptions
-   broken imports
-   script edge cases
-   validation gaps

Goal:

compute-pages\
generate-pages\
qa-check

should run cleanly.

------------------------------------------------------------------------

# Phase 2 --- Content Engine Hardening

Goal: ensure the generator produces trustworthy content.

------------------------------------------------------------------------

## 7. Dataset Expansion

Expand the structured dataset.

Add:

-   tools
-   categories
-   audiences
-   use cases
-   features
-   pricing tiers

Purpose:

-   produce meaningful page coverage
-   avoid trivial site plans

------------------------------------------------------------------------

## 8. LLM Narrative Integration

Add the optional narrative generation layer.

Important boundary:

deterministic system → decides facts and structure\
LLM → writes narrative prose

LLM must **never decide page structure**.

Allowed narrative sections include:

-   introductions
-   summaries
-   best-for explanations
-   FAQ prose

------------------------------------------------------------------------

## 9. Quality Hardening

Harden the generator before trusting it.

Add safeguards for:

-   duplicate semantic pages
-   weak comparisons
-   thin content pages
-   slug collisions
-   pages with insufficient supporting entities

Improve QA reporting and validation.

At this stage the generator should be **trusted to produce
production-grade pages**.

------------------------------------------------------------------------

# Phase 3 --- Frontend MVP

Goal: build the minimal rendering layer.

------------------------------------------------------------------------

## 10. Frontend MVP Render Layer

Create the frontend application.

Typical location:

apps/web

Responsibilities:

-   load markdown pages from `content/pages`
-   route pages by slug
-   render markdown content
-   support local development
-   return 404 for invalid slugs
-   expose basic metadata
-   provide a simple homepage

The frontend **must not compute page definitions**.

It only renders existing generated pages.

------------------------------------------------------------------------

## 11. Frontend Tightening

Clean up the frontend MVP.

Tasks:

-   tighten routing logic
-   simplify markdown loading
-   verify invalid slugs return 404
-   improve metadata handling
-   reduce unnecessary abstractions

------------------------------------------------------------------------

## 12. Verify Local Render + Build

Checkpoint before deployment optimization.

Verify:

pnpm compute-pages\
pnpm generate-pages\
pnpm qa-check\
pnpm --filter web dev\
pnpm --filter web build

At this stage the system should produce:

generated pages + working frontend rendering + successful local build

------------------------------------------------------------------------

# Phase 4 --- Deployment / Build Optimization

Goal: prevent build times from scaling linearly with page count.

------------------------------------------------------------------------

## 13. Build-Time Optimization Layer

Introduce hybrid rendering.

Strategy:

high-priority pages → prebuilt at deploy time\
lower-priority pages → rendered lazily on demand

Requirements:

-   site-plan artifact remains the source of truth
-   valid slugs resolve correctly
-   invalid slugs still return 404
-   build time does not scale with total page count

------------------------------------------------------------------------

## 14. Build-Time Optimization Tightening

Refine the hybrid rendering system.

Ensure:

-   deterministic priority classification
-   predictable routing
-   simple implementation
-   correct caching behavior

------------------------------------------------------------------------

# Phase 5 --- Advanced Scaling Architecture

Goal: improve large-scale SEO structure.

------------------------------------------------------------------------

## 15. Expanded Architecture

Add advanced layers:

-   entity graph
-   internal linking intelligence
-   related-page computation
-   topical clusters
-   smarter navigation structures

These layers improve SEO once the site contains **hundreds or thousands
of pages**.

------------------------------------------------------------------------

## 16. Expanded Architecture Tightening

Refine the advanced architecture.

Tasks:

-   simplify graph logic
-   improve relation modeling
-   reduce unnecessary complexity
-   align documentation with implementation

------------------------------------------------------------------------

# Final Build Order (Summary)

1 Master Scaffold [COMPLETE] 2 Refactor / Tighten [COMPLETE] 3
Page-Definition Index [COMPLETE] 4 Site-Plan Artifact 5
content-engine-rules.md [COMPLETE] 6 Bugfix / Audit 7 Dataset Expansion
8 LLM Integration 9 Quality Hardening 10 Frontend MVP 11 Frontend
Tightening 12 Verify Build 13 Build-Time Optimization 14 Optimization
Tightening 15 Expanded Architecture 16 Architecture Tightening

------------------------------------------------------------------------

# Architectural Principle

The system should evolve in this order:

content engine → trusted generator → rendering layer → deploy
optimization → advanced architecture

This keeps the repository stable and prevents premature complexity.
