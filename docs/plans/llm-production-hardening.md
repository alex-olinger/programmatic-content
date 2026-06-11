# Plan: Production-Quality LLM Narrative Generation

## Context

The LLM boundary in `src/lib/llm.ts` already calls the Claude API when `ANTHROPIC_API_KEY` is set, has file-based caching, and `NarrativeContext` is enriched with full `Tool[]` objects. The README's pre-LLM checklist items 1, 2, and 5 are already done. What remains is **hardening for production use**: retry logic, error recovery, cache correctness, cost visibility, and QA integration.

---

## Step 1: Retry Logic with Backoff (`src/lib/llm.ts`)

Wrap `client.messages.create()` in a retry loop (3 attempts, exponential backoff: 1s → 4s → 16s). Handle Anthropic errors by type: `429` gets longer backoff, `5xx` retries, `4xx` fails immediately. On exhausted retries, return `<!-- LLM_ERROR -->` instead of throwing. Log warnings to stderr on each retry.

~30 lines added. No new dependencies — simple `sleep()` helper with `setTimeout`.

## Step 2: Per-Page Error Recovery (`scripts/generate-pages.ts`)

Wrap per-page `renderMarkdown` call in try/catch inside the loop. On failure: log error, continue to next page, track `failedSlugs[]`. Report success/failure counts at end. Exit code 1 if any failures.

~10 lines changed in main loop.

## Step 3: Cache Key Includes Prompt Content (`src/lib/llm.ts`)

Add `buildPrompt(section, ctx)` output to the `cacheKey` hash input. Any prompt wording change automatically invalidates affected cache entries. One-line change.

## Step 4: Configurable Model and Token Budgets (`src/lib/llm.ts`)

- Read model from `process.env.LLM_MODEL`, fallback to `claude-haiku-4-5-20251001`
- Per-section token budgets: `{ introduction: 384, bestFor: 256, prosAndCons: 512, faq: 768 }`

~10 lines changed.

## Step 5: Dry-Run Mode (`src/lib/llm.ts` + `scripts/generate-pages.ts`)

- New `estimateRun()` function: counts non-cached calls, estimates input tokens (chars/4), computes cost at Haiku pricing
- `--dry-run` flag in generate-pages: load pages, check cache, print summary, exit without API calls
- New `package.json` script: `"generate-pages:dry-run"`

~40 lines across both files.

## Step 6: QA Checks for LLM Output (`src/lib/validate.ts`)

- Check 11: scan generated pages for `<!-- LLM_ERROR` and `<!-- LLM_PLACEHOLDER` markers when API key was set
- Check 12: warn on narrative sections under 50 characters (thin content detection)

~25 lines added.

## Step 7: Documentation Updates

Update stale docs to reflect actual LLM state:
- `docs/rules/content-engine-rules.md` — remove "currently returns placeholders", document real API integration
- `docs/architecture/project-map.md` — update `llm.ts` description
- `README.md` — mark completed checklist items, add dry-run docs

---

## Implementation Order

```
Steps 1, 2, 3  — independent, highest priority (production reliability)
Step 4          — independent (quality of life)
Step 5          — after step 4 (uses token budgets for cost math)
Step 6          — after steps 1-2 (checks for error markers they produce)
Step 7          — last (docs reflect final state)
```

## What This Plan Does NOT Include

- **Concurrency/parallelism** — at ~200 Haiku calls with caching, sequential is fast enough
- **Proactive rate limiting** — retry-with-backoff handles 429s naturally
- **Prompt engineering** — current prompts are a fine starting point; tuning is ongoing, not a code task
- **New abstractions** — no LLMClient wrapper, no RetryPolicy class; stays flat in existing modules

## Critical Files

| File | Steps |
|---|---|
| `src/lib/llm.ts` | 1, 3, 4, 5 |
| `scripts/generate-pages.ts` | 2, 5 |
| `src/lib/validate.ts` | 6 |
| `package.json` | 5 |
| `docs/rules/content-engine-rules.md` | 7 |
| `docs/architecture/project-map.md` | 7 |
| `README.md` | 7 |

## Verification

1. Run `pnpm pipeline` without `ANTHROPIC_API_KEY` — should produce placeholder pages with no errors
2. Run `pnpm generate-pages:dry-run` with API key — should print cost estimate and exit
3. Run `pnpm pipeline` with API key — should generate real narratives, cache them, report results
4. Run again — should hit cache for all pages (fast, zero API calls)
5. Change a prompt in `buildPrompt()`, run again — affected sections regenerate, others cached
6. Run `pnpm qa-check` — should flag any LLM_ERROR markers or thin content
7. `pnpm typecheck` passes
