# TESTING.md — Test Structure & Practices

## Current State
**No test framework is present.** No vitest, jest, mocha, or any other test runner was detected. No `*.test.ts` or `*.spec.ts` files exist.

## Validation as a Substitute
The `qa-check.ts` script acts as a functional correctness check, running `validateAll()` from `src/lib/validate.ts` against generated output. This covers:
- Duplicate slug/ID/canonical key detection
- Zero-tool pages
- Min-tool threshold enforcement per page type
- YAML frontmatter presence and required fields
- Missing expected section headings (`## Tools`, `## FAQ`)
- Orphan file detection (generated `.md` files with no valid page definition)

Run via: `pnpm qa-check`

## Pipeline as Integration Test
The full pipeline effectively serves as an integration test:
```bash
pnpm compute-pages   # data → page definitions
pnpm generate-pages  # definitions → markdown files
pnpm qa-check        # validates output
```
Or combined: `pnpm pipeline`

## What's Not Tested
- Unit tests for individual lib functions (`slugify`, `loadData`, `pageBuilders`, etc.)
- Edge cases in pageRules matching logic
- LLM narrative generation (currently returns placeholder comments)
- Frontend rendering (`apps/web`)

## Recommendations for Future Test Coverage
1. **Unit tests**: `src/lib/slugify.ts`, `src/lib/pageRules.ts`, `src/lib/pageBuilders.ts`
2. **Snapshot tests**: page-definitions output for known seed data
3. **Suggested framework**: vitest (ESM-native, TypeScript-first, fast)

## Type Checking
TypeScript strict mode provides compile-time correctness:
```bash
pnpm typecheck   # runs tsc --noEmit
```
No runtime type errors possible for internal data flows given strict mode and explicit typing.
