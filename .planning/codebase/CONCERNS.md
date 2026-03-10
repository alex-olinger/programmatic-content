# CONCERNS.md — Technical Debt & Areas of Concern

## Summary
This is an early-stage project with a sound architecture but several incomplete or missing subsystems. The biggest risks are around LLM integration (not yet real), test coverage (none), and scale limitations as the tool dataset grows.

---

## High Priority

### LLM Integration Not Implemented
**Location:** `src/lib/llm.ts`
**Issue:** `generateNarrative()` returns placeholder HTML comments. All generated pages contain `<!-- LLM_PLACEHOLDER: ... -->` instead of real content. The site cannot be deployed with real content until this is integrated.
**What's needed:** Real Claude/OpenAI API calls, rate limiting, batching, caching, error handling, and cost controls before integration.

### No Test Coverage
**Issue:** Zero test files exist. No unit tests, integration tests, or snapshot tests for any of the business logic.
**Risk areas without tests:**
- `pageRules.ts` — rule logic is complex and affects all page generation
- `pageIndex.ts` — validation and dedup logic is safety-critical
- `validate.ts` — QA checks run against generated output
- `markdown.ts` — frontmatter escaping correctness
**Recommended:** Add vitest, start with snapshot tests for `compute-pages` output against known seed data.

---

## Medium Priority

### Tools Loaded from Single Flat File
**Location:** `src/lib/loadData.ts:24`
**Issue:** `loadData()` loads all tools from `content/data/tools/tools.json` as a single array. The directory structure suggests individual per-tool files were intended, but the implementation reads one flat file.
**Risk:** Merge conflicts and editor difficulty as the tools list grows. Per-file structure would scale better.

### No Linting or Formatting Config
**Issue:** No ESLint, Prettier, or `.editorconfig` present. Code style relies entirely on manual consistency and TypeScript strict mode.
**Risk:** Style drift as contributors add code. Easy to fix — low friction to add.

### Frontend (`apps/web`) Is a Placeholder
**Location:** `apps/` directory exists but `apps/web/` was not found during exploration.
**Issue:** The frontend rendering layer exists conceptually but may not be scaffolded yet.
**Risk:** The full pipeline (generate → render → deploy) cannot be validated end-to-end.

### Stale Directory in Root
**Location:** `C:\Users\alexo\.claude\plugins\marketplaces\claude-plugins-official` at project root
**Issue:** A Windows-style absolute path directory is nested in the project root. This is likely an accidental artifact of a plugin install and should be removed.
**Risk:** Low functional impact, but pollutes the project structure and could cause confusion.

---

## Low Priority

### LLM Context Is Sparse
**Location:** `src/lib/llm.ts` — `NarrativeContext`
**Issue:** `NarrativeContext` passes `matchedToolIds` (IDs only) not full `Tool` objects. When real LLM integration is added, the context must be enriched with full tool data (names, descriptions, features) to generate useful narratives.

### No Caching for Generated Pages
**Issue:** `generate-pages.ts` deletes all `.md` files and regenerates everything on every run, even if inputs haven't changed.
**Risk:** As page count grows (potentially thousands), full regeneration will be slow and expensive (once LLM is real).
**Future need:** Content-hash-based incremental generation.

### Overlap Score Heuristic Is Simple
**Location:** `src/lib/pageRules.ts:21-27`
**Issue:** `computeOverlapScore()` counts shared attribute IDs across 4 dimensions. This is a reasonable heuristic but doesn't weight dimensions (a shared category is more meaningful than a shared feature).
**Risk:** Some low-quality comparison pages may pass the `MIN_OVERLAP_SCORE = 2` threshold.

### No Slug Collision Safeguard Across Page Types
**Issue:** `deduplicateCandidates()` catches slug collisions but only at runtime during `compute-pages`. There's no static enforcement preventing two rule functions from producing the same slug pattern.
**Risk:** Low with current 9 rules, but worth monitoring as new rules are added.

### Generated Index Is Gitignored
**Location:** `content/index/page-definitions.json`
**Issue:** The canonical site plan is gitignored and must be regenerated locally. CI/CD cannot validate the index without running `compute-pages` first.
**Risk:** Divergence between developer environments if data changes aren't propagated.

---

## Security

### No Secrets in Codebase
No API keys, tokens, or credentials found. LLM integration (when added) will need proper secret management via environment variables.

### YAML Injection Mitigated
`markdown.ts` includes `yamlEscape()` for frontmatter values — low risk given data is internal JSON.

---

## Fragile Areas
| Area | Fragility | Reason |
|------|-----------|--------|
| `loadData.ts` | Medium | Fails hard if any JSON file is missing or malformed |
| `compute-pages.ts` | Low | Logs and exits cleanly on error |
| `validate.ts` | Low | Well-structured, 9 isolated checks |
| `llm.ts` | High (when real) | No retry, rate limiting, or cost guard yet |
| Page count growth | Medium | Full regen + no caching will become slow |
