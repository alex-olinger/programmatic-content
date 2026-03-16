import fs from 'fs' // node file system for reading JSON artifacts from disk
import path from 'path' // path utilities for building OS-safe file paths

// Absolute path to the generated index directory, two levels up from apps/web
const INDEX_DIR = path.join(process.cwd(), '..', '..', 'content', 'index')

// ── Topical Clusters types (mirrors src/lib/topicalClusters.ts) ───────────────

/** ClusterMember is a non-pillar page that belongs to a topical cluster */
export interface ClusterMember {
  slug: string // URL slug of the member page
  title: string // human-readable title of the member page
  pageType: string // page family, e.g. "alternatives", "feature"
}

/** TopicalCluster groups related pages under a single pillar page */
export interface TopicalCluster {
  pillarSlug: string // slug of the authoritative pillar page
  pillarTitle: string // title of the pillar page for display
  pillarType: string // page type of the pillar — always "category" or "use-case"
  entityType: string // entity type that defines membership — "category" or "use-case"
  entityId: string // the primary entity ID shared by all members
  members: ClusterMember[] // all non-pillar pages that belong under this pillar
}

/** TopicalClustersIndex is the shape of topical-clusters.json */
export interface TopicalClustersIndex {
  generatedAt: string // ISO timestamp of when this index was built
  totalClusters: number // number of non-empty clusters found
  clusters: TopicalCluster[] // one entry per qualifying pillar page
}

// ── Page Links types (mirrors src/lib/pageLinks.ts) ───────────────────────────

/** RelatedPage is one scored neighbor in the related-pages list */
export interface RelatedPage {
  slug: string // URL slug of the related page
  title: string // human-readable title for link text
  pageType: string // page family of the related page
  score: number // Jaccard similarity score in [0, 1]
}

/** PageLinkEntry holds the related pages for a single slug */
export interface PageLinkEntry {
  slug: string // slug of the page this entry describes
  title: string // title of the page this entry describes
  pageType: string // page type of the page this entry describes
  relatedPages: RelatedPage[] // top-N related pages sorted by score descending
}

/** PageLinksIndex is the shape of page-links.json */
export interface PageLinksIndex {
  generatedAt: string // ISO timestamp of when this index was built
  totalPages: number // number of pages included in the index
  maxRelatedPages: number // cap used when selecting top-N related pages
  pages: Record<string, PageLinkEntry> // slug → entry map for O(1) lookup
}

// ── Loaders ───────────────────────────────────────────────────────────────────

/** loadTopicalClusters reads topical-clusters.json from the content index directory */
export function loadTopicalClusters(): TopicalClustersIndex {
  const filePath = path.join(INDEX_DIR, 'topical-clusters.json') // full path to artifact
  const raw = fs.readFileSync(filePath, 'utf-8') // read raw JSON from disk
  return JSON.parse(raw) as TopicalClustersIndex // cast to typed shape
}

/** loadPageLinks reads page-links.json from the content index directory */
export function loadPageLinks(): PageLinksIndex {
  const filePath = path.join(INDEX_DIR, 'page-links.json') // full path to artifact
  const raw = fs.readFileSync(filePath, 'utf-8') // read raw JSON from disk
  return JSON.parse(raw) as PageLinksIndex // cast to typed shape
}
