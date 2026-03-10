# CONVENTIONS.md — Code Style & Patterns

## Language & Tooling
- **TypeScript** with `strict: true` (`tsconfig.json`)
- **Runtime**: `tsx` for direct execution (no compile step)
- **Module system**: ESM — all imports use `.js` extensions even in `.ts` source files
- **No linting**: no ESLint or Prettier config detected

## Naming Conventions
| Kind | Convention | Example |
|------|-----------|---------|
| Functions | camelCase | `buildPageDefinition`, `validateAll`, `loadData` |
| Types/Interfaces | PascalCase | `PageDefinition`, `ValidationReport`, `SectionName` |
| Constants | SCREAMING_SNAKE_CASE | `MIN_TOOLS`, `REQUIRED_FRONTMATTER`, `MIN_OVERLAP_SCORE` |
| Files | camelCase | `pageBuilders.ts`, `loadData.ts`, `pageIndex.ts` |
| Scripts | kebab-case | `compute-pages.ts`, `generate-pages.ts`, `qa-check.ts` |
| JSON data | kebab-case | `page-definitions.json`, `page-definition-report.json` |

## Import Style
- All imports use `.js` extension (required for tsx ESM resolution):
  ```ts
  import type { PageDefinition } from '../types/pages.js';
  import { MIN_TOOLS } from './pageRules.js';
  ```
- `type` imports separated: `import type { ... }` for type-only imports
- Path resolution uses `import.meta.url` (not `process.cwd()`)

## TypeScript Patterns
- Strict mode enabled; no `any` types
- `Partial<Record<K, V>>` for optional keyed maps (e.g., sections)
- `Extract<T, U>` for compile-time type narrowing
- Optional chaining and nullish coalescing (`??`) used consistently
- Named exports only — no default exports in lib files

## Function Style
- Pure functions preferred; no class-based patterns
- Builder pattern for constructing complex objects (`buildPageDefinition`)
- Single-responsibility functions — each does one clear thing
- Explicit return types on exported functions

## Error Handling
- `try/catch` with contextual error messages
- `process.exit(1)` on critical/unrecoverable failures (scripts only)
- Validation separated into its own layer (`validate.ts`) — not mixed with generation
- Errors and warnings as separate arrays in `ValidationReport`

## Validation Pattern (Two-Layer)
1. **Rule-level**: pageRules emit all candidates with `>= 1 tool`
2. **Threshold layer**: `validateCandidates` in pageIndex applies min-tool rules and overlap checks
- Constants centralized: `MIN_TOOLS` in `pageRules.ts`, `MIN_OVERLAP_SCORE` in `pageIndex.ts`

## Constants
- Centralized per-module, exported for reuse
- Never hardcoded inline — always named constants

## Data Flow Pattern
- Immutable: functions receive data, return new data (no mutation)
- Pipeline composition: each script stage transforms data and passes to next
- Source of truth: `content/data/` JSON files loaded via `loadData.ts`

## Markdown Generation
- `yamlEscape()` helper in `markdown.ts` for frontmatter value safety
- Frontmatter required fields: `title`, `description`, `slug`, `pageType`, `generatedAt`

## Script Conventions
- Scripts run via `pnpm` task runner (defined in `package.json`)
- Pipeline order: `compute-pages` → `generate-pages` → `qa-check`
- Stale file cleanup: `generate-pages.ts` deletes all `.md` before writing new files
