# CLAUDE.md --- Programmatic Content Site

This file provides guidance to Claude Code and other AI development
tools when working inside this repository.

AI assistants should read this file before making structural
modifications.

------------------------------------------------------------------------

# Project Overview

This repository implements a **programmatic content site generator**.

The architecture intentionally separates:

data → page definitions → site plan → generated content → frontend
rendering

Key principle:

The content engine decides **what pages exist**.\
The frontend decides **how pages are displayed**.

------------------------------------------------------------------------

# Documentation Discovery

Before making architectural or structural changes, AI assistants must
read the documentation in the `docs/` directory.

Key documents include:

docs/build-sequence.md\
Defines the official architectural evolution order.

docs/project-map.md\
Explains the directory structure and responsibilities of each layer.

docs/ai-editing-rules.md\
Defines safety rules for AI-assisted modifications.

Additional documentation may be added later in the project lifecycle and
should also be treated as authoritative once present.

If implementation conflicts with documentation, the AI assistant should:

1.  Assume documentation reflects architectural intent
2.  Propose a minimal correction rather than rewriting architecture
3.  Update documentation only if the architecture intentionally changes

------------------------------------------------------------------------

# Critical Architecture Freeze

The following layers are considered **stable architecture** and must not
be rewritten unless explicitly instructed:

-   Structured data layer (`content/data`)
-   Page-definition computation
-   Site-plan artifact (`content/index/page-definitions.json`)
-   Content generation pipeline
-   Frontend rendering layer (`apps/web`)

If a change appears to require rewriting these layers:

1.  Stop
2.  Explain why the change is required
3.  Propose a minimal modification instead

------------------------------------------------------------------------

# Architecture Layers

## 1. Structured Data Layer

Location:

content/data/

Defines entities such as:

-   tools
-   categories
-   audiences
-   use cases
-   features

This layer is the **source of truth**.

------------------------------------------------------------------------

## 2. Page Definition Layer

Location:

content/index/page-definitions.json

Contains the canonical list of valid pages.

Each definition includes:

-   slug
-   page type
-   entities
-   matched tools
-   validation status

This artifact represents the **site plan**.

------------------------------------------------------------------------

## 3. Content Generation Layer

Scripts compute page definitions and generate markdown pages.

Pipeline:

compute-pages → generate-pages → qa-check

Generated pages are written to:

content/pages/

------------------------------------------------------------------------

## 4. Frontend Render Layer

Location:

apps/web

Responsibilities:

-   slug routing
-   markdown rendering
-   metadata output
-   page layout

The frontend must **never compute page definitions**.

------------------------------------------------------------------------

# Deterministic vs LLM Responsibilities

Deterministic system decides:

-   page structure
-   slug generation
-   entity relationships
-   tool inclusion
-   comparison data

LLM layer generates:

-   narrative prose
-   summaries
-   introductions
-   FAQ answers

LLM must **never alter page structure**.

------------------------------------------------------------------------

# Editing Guidelines

AI assistants should:

-   respect architecture boundaries
-   modify generation logic rather than generated files
-   preserve the deterministic pipeline
-   keep implementations simple and explicit

Avoid introducing:

-   databases
-   background job systems
-   complex infrastructure

unless explicitly requested.

------------------------------------------------------------------------

# Development Workflow

Typical local workflow:

pnpm compute-pages\
pnpm generate-pages\
pnpm qa-check\
pnpm --filter web dev

Deployment workflow:

generate pages → commit → git push → hosting rebuilds site

------------------------------------------------------------------------

# Mental Model

Treat this repository as:

A **deterministic content factory** with a rendering layer on top.
