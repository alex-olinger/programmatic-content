# External Integrations

**Analysis Date:** 2026-03-10

## APIs & External Services

**None currently integrated** - this is a deterministic content factory with no external API calls.

Future integrations will be added in Phase 2:

**[Planned - LLM Integration]:**
- Service: Anthropic Claude or OpenAI (not yet selected)
- Purpose: Generate narrative sections (introductions, summaries, FAQs)
- SDK/Client: Not yet installed (placeholder in `src/lib/llm.ts`)
- Auth: Will require API key (env var to be defined)
- Boundary: LLM generates narrative prose only; page structure remains deterministic

**[Planned - Hosting / CDN]:**
- Service: Not yet selected (Phase 4)
- Purpose: Serve generated markdown + frontend
- Auth: Deployment token (to be defined)

## Data Storage

**Databases:**
- None - all data is JSON files on disk

**File Storage:**
- Local filesystem only
  - Data source: `content/data/` (source of truth)
  - Generated index: `content/index/` (gitignored, computed)
  - Generated pages: `content/pages/` (gitignored, markdown output)

**Caching:**
- None implemented - deterministic rebuild on demand

## Authentication & Identity

**Auth Provider:**
- None - no user authentication or identity system

## Monitoring & Observability

**Error Tracking:**
- None - relies on script exit codes and console output

**Logs:**
- Console only (`console.log`, `console.error` in scripts)
- Scripts output progress to stdout:
  - `pnpm compute-pages` → candidate counts and validation summary
  - `pnpm generate-pages` → file write count
  - `pnpm qa-check` → validation results

## CI/CD & Deployment

**Hosting:**
- Not yet deployed (Phase 3 onwards)
- Future: Static file host (Vercel, Netlify, or equivalent)

**CI Pipeline:**
- GitHub Actions configured but minimal (check `.github/workflows/` for details)
- Typical workflow: compute → generate → validate on PR
- No secrets or credential management needed

## Environment Configuration

**Required env vars:**
- None currently - system is fully deterministic

**Future env vars (Phase 2+):**
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` (once LLM integration added)
- Deployment token for hosting provider (Phase 4)

**Secrets location:**
- Not applicable - no secrets used in current architecture
- Future secrets: keep in GitHub Secrets or environment-specific config

## Webhooks & Callbacks

**Incoming:**
- None - fully self-contained command-line pipeline

**Outgoing:**
- None - no external service notifications

## Data Dependencies

**Tool Metadata:**
- Source: `content/data/tools/tools.json`
- Contains: 6 seed tools (Notion, Jasper, Copy.ai, Descript, Synthesia, Otter.ai)
- Each tool has: categories, audiences, use-cases, features, price tiers, integrations
- Integrations field references: Slack, Zapier, Google Drive (metadata only, not API calls)

**Taxonomy Datasets:**
- Categories: `content/data/taxonomy/categories.json`
- Audiences: `content/data/taxonomy/audiences.json`
- Use Cases: `content/data/taxonomy/use-cases.json`
- Features: `content/data/taxonomy/features.json`
- Price Tiers: `content/data/taxonomy/price-tiers.json`
- Integrations: `content/data/taxonomy/integrations.json` (reference data, not API calls)

## System Dependencies

**Node.js APIs used:**
- `fs` - read/write JSON and markdown files
- `path` - resolve file paths across platforms
- `import.meta.url` - get script location for path resolution

**No external HTTP/network calls** - system is fully offline-capable.

---

*Integration audit: 2026-03-10*
