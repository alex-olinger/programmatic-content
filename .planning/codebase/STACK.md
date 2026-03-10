# Technology Stack

**Analysis Date:** 2026-03-10

## Languages

**Primary:**
- TypeScript 5.4+ - Entire codebase, including scripts, libraries, and types
- JSON - Structured data layer (`content/data/**/*.json`)
- Markdown - Generated page output (`content/pages/*.md`)

## Runtime

**Environment:**
- Node.js (no specific version pinned; lockfile reflects current latest)
- No `.nvmrc` - uses system Node.js version

**Package Manager:**
- pnpm 9.0+ (lockfileVersion: 9.0 in `pnpm-lock.yaml`)
- Lockfile: present (`pnpm-lock.yaml`)

## Frameworks

**Core:**
- No application frameworks required - pure Node.js scripts and libraries
- Uses native Node.js APIs: `fs`, `path`

**Build/Dev:**
- tsx 4.7+ - TypeScript executor (no compile step needed; ESM runtime)
- TypeScript 5.4+ - Type checking only (`tsc --noEmit`)

## Key Dependencies

**Zero production dependencies** - the codebase has no external npm packages except dev tools.

**Dev only:**
- `@types/node` ^20.0.0 - Type definitions for Node.js APIs
- `tsx` ^4.7.0 - TypeScript ESM runner (executes `.ts` directly without compilation)
- `typescript` ^5.4.0 - Type compiler (verify via `tsc --noEmit`)

## Configuration

**Environment:**
- No environment variables required - system is fully deterministic
- No `.env` files or secrets management needed
- No external service credentials required

**Build:**
- `tsconfig.json`:
  - Target: ES2022
  - Module: ESNext
  - Module resolution: bundler
  - Strict type checking enabled
  - Resolves JSON modules as imports
- No build tool (webpack, vite, rollup) - scripts run directly via tsx

**Scripts:**
- `pnpm compute-pages` - generates page candidates and index
- `pnpm generate-pages` - produces markdown from valid candidates
- `pnpm qa-check` - validates generated content
- `pnpm pipeline` - runs all three in sequence
- `pnpm typecheck` - runs tsc type verification
- `pnpm clean` - removes generated artifacts

## Platform Requirements

**Development:**
- Node.js (current or LTS)
- pnpm
- TypeScript knowledge optional (types present but not required to run)

**Production:**
- Static file serving only (no server runtime)
- Generated markdown files + optional frontend (Phase 3 onwards)
- No database, no external APIs, no cloud SDK required

## Import Patterns

**Module System:**
- ESM (ES modules)
- All imports use `.js` extensions in TypeScript source (required for tsx ESM compatibility)
- Example: `import { loadData } from '../src/lib/loadData.js'`

**Path Resolution:**
- `import.meta.url` used for script entry points (Phase 3+ will need path aliases)
- No path aliases configured yet (minimal codebase)

---

*Stack analysis: 2026-03-10*
