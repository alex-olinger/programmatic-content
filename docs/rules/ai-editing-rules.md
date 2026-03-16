# AI Editing Rules --- Programmatic Content Site

This document defines rules for AI tools modifying this repository.

AI assistants should read this file before making structural changes.

------------------------------------------------------------------------

# Core Architectural Rule

data → page definitions → site plan → generated content → frontend
rendering

AI tools must respect the separation between these layers.

------------------------------------------------------------------------

# Rule 1 --- Do Not Move Page Computation Into the Frontend

Page definitions must be computed by the content engine scripts.

The frontend must never: - generate page definitions - compute tool
lists - invent page slugs - infer pages dynamically

The frontend may only render existing pages.

------------------------------------------------------------------------

# Rule 2 --- The Site Plan Is the Source of Truth

Valid pages are stored in:

content/index/page-definitions.json

If a slug is not present there, it should not resolve.

------------------------------------------------------------------------

# Rule 3 --- Generated Pages Should Not Be Manually Edited

Files in:

content/pages/

are generated artifacts.

Modify generation logic instead of editing generated files.

------------------------------------------------------------------------

# Rule 4 --- Deterministic vs LLM Responsibilities

Deterministic system decides: - page structure - page slug - page
entities - tool inclusion - comparison data

LLM may generate: - narrative prose - summaries - introductions - FAQ
explanations

LLM must never change page structure or data facts.

------------------------------------------------------------------------

# Rule 5 --- Avoid Premature Complexity

AI tools should not introduce: - databases - background workers -
complex orchestration layers - unnecessary APIs

unless explicitly requested.

The system is intentionally static-first.

------------------------------------------------------------------------

# Rule 6 --- Preserve the Content Engine Pipeline

The pipeline must remain:

compute-pages → generate-pages → qa-check

------------------------------------------------------------------------

# Rule 7 --- Keep Page Generation Inspectable

Page definitions should remain inspectable in:

content/index/

Avoid hiding generation logic behind opaque abstractions.

------------------------------------------------------------------------

# Rule 8 --- Avoid Full-Site Eager Rebuild Assumptions

Do not assume all pages will be pre-rendered. Large sites may require
hybrid rendering strategies.

------------------------------------------------------------------------

# Rule 9 --- Prefer Simplicity

Prefer: - clear functions - explicit rules - small modules

Avoid: - clever abstractions - excessive configuration - magic behavior

------------------------------------------------------------------------

# Rule 10 --- Preserve Architecture Documentation

If structural changes occur, update:

docs/project-map.md docs/build-sequence.md docs/content-engine-rules.md

------------------------------------------------------------------------

# Safe AI Editing Pattern

inspect repository read docs/ understand architecture boundaries propose
minimal change implement change update documentation if needed

------------------------------------------------------------------------

# One-Line Principle

Treat this repository as:

a deterministic content factory with a rendering layer on top
