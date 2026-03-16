Show current project status: page definition counts, generated page counts, and any pending work.

```bash
echo "=== Page Definitions ===" && cat content/index/page-definition-report.json 2>/dev/null || echo "Not generated yet"
echo "=== Generated Pages ===" && ls content/pages/*.md 2>/dev/null | wc -l && echo "pages"
echo "=== Git Status ===" && git status --short
```

Summarize: how many valid definitions, how many pages generated, and what's uncommitted.
