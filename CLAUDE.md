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

# AI Working Practices

## Core Principles

-   **Simplicity first**: make every change as simple as possible; impact minimal code
-   **No laziness**: find root causes; no temporary fixes; senior developer standards
-   **Minimal impact**: changes should only touch what is necessary; avoid introducing bugs

------------------------------------------------------------------------

## Plan Mode

-   Enter plan mode for **any non-trivial task** (3+ steps or architectural decisions)
-   Write detailed specs upfront to reduce ambiguity
-   Use plan mode for verification steps, not just building
-   If something goes sideways, **stop and re-plan immediately** — do not keep pushing

------------------------------------------------------------------------

## Task Management

1.  **Plan first**: write plan to `tasks/todo.md` with checkable items
2.  **Verify plan**: check in before starting implementation
3.  **Track progress**: mark items complete as you go
4.  **Explain changes**: high-level summary at each step
5.  **Document results**: add review section to `tasks/todo.md`
6.  **Capture lessons**: update `tasks/lessons.md` after corrections

------------------------------------------------------------------------

## Subagent Strategy

-   Use subagents liberally to keep the main context window clean
-   Offload research, exploration, and parallel analysis to subagents
-   For complex problems, throw more compute at it via subagents
-   One task per subagent for focused execution

------------------------------------------------------------------------

## Self-Improvement Loop

-   After **any correction** from the user: update `tasks/lessons.md` with the pattern
-   Write rules that prevent the same mistake from recurring
-   At session start: read `tasks/lessons.md` for prior lessons; read any other `.md` files in `tasks/` to understand current and recent work
-   Ruthlessly iterate until mistake rate drops

------------------------------------------------------------------------

## Verification Before Done

-   Never mark a task complete without proving it works
-   Diff behavior between main and your changes when relevant
-   Ask: "Would a staff engineer approve this?"
-   Run tests, check logs, demonstrate correctness

------------------------------------------------------------------------

## Demand Elegance

-   For non-trivial changes: pause and ask "is there a more elegant way?"
-   If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
-   Skip this for simple, obvious fixes — do not over-engineer

------------------------------------------------------------------------

## Autonomous Bug Fixing

-   When given a bug report: fix it — do not ask for hand-holding
-   Point at logs, errors, failing tests, then resolve them
-   Go fix failing CI tests without being told how

------------------------------------------------------------------------

## Commit and PR Messages

**After completing any task that changes files, Claude must automatically:**

1.  Create a new branch (if not already on a feature branch)
2.  Stage and commit with a meaningful message — never leave it blank
3.  Push the branch to remote
4.  Open a PR targeting `testing` with a filled-in Summary + Test plan

Do not wait to be asked. This is part of completing the task.

Rules:
-   Commit message format: `type: short description` (e.g. `docs:`, `fix:`, `feat:`, `ci:`)
-   Body lines explain *why*, not *what* — the diff shows what changed
-   PR description must use the Summary + Test plan format — never submit an empty template
-   PRs always target `testing` as base branch — never `main` directly
-   Never push directly to `main` or `testing`

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
