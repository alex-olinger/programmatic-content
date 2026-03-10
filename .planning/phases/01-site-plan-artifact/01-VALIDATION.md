---
phase: 1
slug: site-plan-artifact
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected — no test framework installed |
| **Config file** | None — Wave 0 covers gaps |
| **Quick run command** | `pnpm typecheck` |
| **Full suite command** | `pnpm typecheck && pnpm compute-pages` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm typecheck`
- **After every plan wave:** Run `pnpm typecheck && pnpm compute-pages`
- **Before `/gsd:verify-work`:** `pnpm typecheck && pnpm pipeline` must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | PLAN-01 | unit/typecheck | `pnpm typecheck` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | PLAN-02 | smoke | `pnpm compute-pages` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | PLAN-03 | smoke | `pnpm compute-pages` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No automated unit test file exists for `buildSitePlanSummary()` — verify via `pnpm compute-pages` + JSON inspection
- [ ] No test framework installed — `pnpm typecheck` is the primary validation proxy

*Given the small scope (~40 lines, 2 functions), installing a test framework is disproportionate. Use typecheck + smoke pipeline.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `site-plan-summary.json` contains only valid pages | PLAN-02 | No unit test framework | Run `pnpm compute-pages`, open `content/index/site-plan-summary.json`, confirm no `isValid: false` entries |
| Tool coverage stats correct | PLAN-01 | No unit test framework | Inspect `toolCoverage` in summary, cross-reference against `page-definitions.json` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
