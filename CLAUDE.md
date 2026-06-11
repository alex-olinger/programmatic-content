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

The `docs/` directory is organized into subcategories:

- `docs/architecture/` — system structure, build order, entity graphs, workflow diagrams
- `docs/rules/` — editing rules and content engine rules
- `docs/walkthroughs/` — code walkthroughs and implementation deep-dives
- `docs/plans/` — task plans written during development (checkable items, review sections)

Key documents include:

docs/architecture/build-sequence.md\
Defines the official architectural evolution order.

docs/architecture/project-map.md\
Explains the directory structure and responsibilities of each layer.

docs/rules/ai-editing-rules.md\
Defines safety rules for AI-assisted modifications.

Additional documentation may be added later in the project lifecycle and
should also be treated as authoritative once present.

If implementation conflicts with documentation, the AI assistant should:

1. Assume documentation reflects architectural intent
2. Propose a minimal correction rather than rewriting architecture
3. Update documentation only if the architecture intentionally changes

------------------------------------------------------------------------

# Critical Architecture Freeze

The following layers are considered **stable architecture** and must not
be rewritten unless explicitly instructed:

- Structured data layer (`content/data`)
- Page-definition computation
- Site-plan artifact (`content/index/page-definitions.json`)
- Content generation pipeline
- Frontend rendering layer (`apps/web`)

If a change appears to require rewriting these layers:

1. Stop
2. Explain why the change is required
3. Propose a minimal modification instead

------------------------------------------------------------------------

# Architecture Layers

## 1. Structured Data Layer

Location:

content/data/

Defines entities such as:

- tools
- categories
- audiences
- use cases
- features

This layer is the **source of truth**.

------------------------------------------------------------------------

## 2. Page Definition Layer

Location:

content/index/page-definitions.json

Contains the canonical list of valid pages.

Each definition includes:

- slug
- page type
- entities
- matched tools
- validation status

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

- slug routing
- markdown rendering
- metadata output
- page layout

The frontend must **never compute page definitions**.

------------------------------------------------------------------------

# Deterministic vs LLM Responsibilities

Deterministic system decides:

- page structure
- slug generation
- entity relationships
- tool inclusion
- comparison data

LLM layer generates:

- narrative prose
- summaries
- introductions
- FAQ answers

LLM must **never alter page structure**.

------------------------------------------------------------------------

# Editing Guidelines

AI assistants should:

- respect architecture boundaries
- modify generation logic rather than generated files
- preserve the deterministic pipeline
- keep implementations simple and explicit

Avoid introducing:

- databases
- background job systems
- complex infrastructure

unless explicitly requested.

------------------------------------------------------------------------

# AI Working Practices

## Core Principles

- **Simplicity first**: make every change as simple as possible; impact minimal code
- **No laziness**: find root causes; no temporary fixes; senior developer standards
- **Minimal impact**: changes should only touch what is necessary; avoid introducing bugs

------------------------------------------------------------------------

## Plan Mode

- Enter plan mode for **any non-trivial task** (3+ steps or architectural decisions)
- Write detailed specs upfront to reduce ambiguity
- Use plan mode for verification steps, not just building
- If something goes sideways, **stop and re-plan immediately** — do not keep pushing

------------------------------------------------------------------------

## Task Management

1. **Plan first**: write plan to `docs/plans/<task-name>.md` with checkable items
2. **Verify plan**: check in before starting implementation
3. **Track progress**: mark items complete as you go
4. **Explain changes**: high-level summary at each step
5. **Document results**: add review section to the plan file in `docs/plans/`
6. **Capture lessons**: update `tasks/lessons.md` after corrections

------------------------------------------------------------------------

## Subagent Strategy

- Use subagents liberally to keep the main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

------------------------------------------------------------------------

## Self-Improvement Loop

- After **any correction** from the user: update `tasks/lessons.md` with the pattern
- Write rules that prevent the same mistake from recurring
- At session start: read `tasks/lessons.md` for prior lessons
- Ruthlessly iterate until mistake rate drops

------------------------------------------------------------------------

## Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

------------------------------------------------------------------------

## Anti-Over-Engineering

**The problem:** Claude defaults to framework-style abstractions learned from open-source
codebases. Resist this. A 500-line flat module is better than 1500 lines across 3–4 layers
unless the layering is explicitly justified.

### Rules

- **Flat before layered.** Write the simplest direct implementation first. Do not introduce
  abstraction layers unless a concrete, present need requires them — not a hypothetical
  future one.

- **No speculative generalization.** Do not extract base classes, generic factories,
  plugin systems, or strategy patterns unless more than one concrete use case exists
  *right now* in this codebase.

- **Line count as a smell check.** If an implementation exceeds 2× the line count of a
  direct equivalent, stop and justify each layer explicitly. If you can't justify it,
  flatten it.

- **One layer of indirection is usually enough.** Service → DB call. Handler → Service.
  Do not add a Repository, a UnitOfWork, and an AbstractBaseRepository on top of a
  Postgres client that already handles connection pooling.

- **No framework scaffolding for app code.** Do not structure application logic the way
  a library or framework would structure its own internals. Apps are not frameworks.

- **Ask before adding an interface/abstract class.** If a new interface has exactly one
  implementation and no test double requires it, do not create it.

### The check before committing

Before presenting code, answer:
1. Could this be written with one fewer layer? If yes — write that version.
2. Is every abstraction boundary justified by something that exists today, not "we might need it"?
3. Would a new team member understand this without reading three other files first?

If any answer is "no," refactor before presenting.

------------------------------------------------------------------------

## Demand Elegance

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — do not over-engineer

------------------------------------------------------------------------

## Autonomous Bug Fixing

- When given a bug report: fix it — do not ask for hand-holding
- Point at logs, errors, failing tests, then resolve them
- Go fix failing CI tests without being told how

------------------------------------------------------------------------

## Commit and PR Messages

**After completing any task that changes files, Claude must automatically:**

1. Create a new branch (if not already on a feature branch)
2. Stage and commit with a meaningful message — never leave it blank
3. Push the branch to remote
4. Open a PR targeting `testing` with a filled-in Summary + Test plan

Do not wait to be asked. This is part of completing the task.

Rules:

- Commit message format: `type: short description` (e.g. `docs:`, `fix:`, `feat:`, `ci:`)
- Body lines explain *why*, not *what* — the diff shows what changed
- PR description must use the Summary + Test plan format — never submit an empty template
- PRs always target `dev` as base branch — never `main` directly
- Never push directly to `main` or `dev`

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
