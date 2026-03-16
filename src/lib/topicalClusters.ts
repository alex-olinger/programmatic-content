import type { PageDefinition } from '../types/pages.js'; // page definition type for input

/** ClusterMember is a non-pillar page that belongs to a topical cluster */
export interface ClusterMember {
  slug: string; // URL slug of the member page
  title: string; // human-readable title of the member page
  pageType: string; // page family, e.g. "alternatives", "feature"
}

/** TopicalCluster groups related pages under a single pillar page */
export interface TopicalCluster {
  pillarSlug: string; // slug of the authoritative pillar page
  pillarTitle: string; // title of the pillar page, for display
  pillarType: string; // page type of the pillar — always "category" or "use-case"
  entityType: string; // entity type used to define membership — "category" or "use-case"
  entityId: string; // the primary entity ID shared by all members
  members: ClusterMember[]; // all non-pillar pages that reference this entity
}

/** TopicalClustersIndex is the full artifact written to topical-clusters.json */
export interface TopicalClustersIndex {
  generatedAt: string; // ISO timestamp of when this index was built
  totalClusters: number; // number of non-empty clusters found
  clusters: TopicalCluster[]; // one entry per category or use-case pillar with members
}

/** buildTopicalClusters groups pages under category and use-case pillar pages */
export function buildTopicalClusters(validPages: PageDefinition[]): TopicalClustersIndex {
  // Pillar pages are the broadest authority pages — category and use-case types only
  const pillars = validPages.filter(
    (p) => p.pageType === 'category' || p.pageType === 'use-case' // narrow to pillar types
  );

  const clusters: TopicalCluster[] = []; // accumulate clusters for each qualifying pillar

  for (const pillar of pillars) {
    const entityType = pillar.pageType; // "category" or "use-case" — determines which entity array to check

    // Derive the primary entity ID from the pillar's own entity arrays
    const entityId =
      entityType === 'category'
        ? pillar.entities.categories[0] // category pillars anchor on their first category
        : pillar.entities.useCases[0]; // use-case pillars anchor on their first use case

    if (!entityId) continue; // skip pillars that lack a primary entity (data anomaly)

    // Collect all non-pillar pages that reference this primary entity
    const members: ClusterMember[] = validPages
      .filter((page) => {
        if (page.slug === pillar.slug) return false; // exclude the pillar itself from its member list
        if (entityType === 'category') return page.entities.categories.includes(entityId); // match on category membership
        return page.entities.useCases.includes(entityId); // match on use-case membership
      })
      .map((page) => ({ slug: page.slug, title: page.title, pageType: page.pageType })); // extract display fields only

    if (members.length === 0) continue; // skip empty clusters — no members means no useful cluster

    clusters.push({
      pillarSlug: pillar.slug, // anchor slug for navigation links
      pillarTitle: pillar.title, // anchor title for display
      pillarType: pillar.pageType, // category or use-case
      entityType, // tells consumers which entity dimension defines membership
      entityId, // the shared entity ID for this cluster
      members, // all pages that belong under this pillar
    });
  }

  return {
    generatedAt: new Date().toISOString(), // timestamp for cache-busting and audit trail
    totalClusters: clusters.length, // number of non-empty clusters found
    clusters, // full list ordered by pillar declaration order in page index
  };
}
