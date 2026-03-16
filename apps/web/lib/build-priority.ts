// Priority tiers for hybrid rendering — high-priority pages pre-built at deploy time,
// low-priority pages rendered on-demand with ISR caching.
// Rendering priority is a deployment concern only — no changes to PageDefinition or content pipeline.

// Page types that are top-of-funnel, high SEO value, and stable in count.
// These ~56 pages are pre-built at deploy time via generateStaticParams.
export const HIGH_PRIORITY_TYPES: ReadonlySet<string> = new Set([
  'category', // 6 pages — broad category landing pages, high SEO surface
  'tool-detail', // 16 pages — individual tool profile pages, frequently searched
  'alternatives', // 16 pages — "alternatives to X" pages, high commercial intent
  'use-case', // 10 pages — use-case landing pages, mid-funnel traffic
  'feature', // 8 pages — feature comparison landing pages, intent-rich
])

// Page types that are combinatorial and grow with dataset expansion.
// These ~134 pages render on-demand and are cached for 24 hours via ISR.
// Low-priority types: comparison (53), audience-category (27), audience-use-case (42), pricing (12)
