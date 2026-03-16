import type { PageDefinition } from '../types/pages.js'; // page definition type for input

/** Maximum number of related pages to surface per page */
export const MAX_RELATED_PAGES = 5; // controls how many related links appear in output

/** RelatedPage is one scored neighbor in the related-pages list */
export interface RelatedPage {
  slug: string; // URL slug of the related page
  title: string; // human-readable title for link text
  pageType: string; // page family, e.g. "category", "alternatives"
  score: number; // Jaccard similarity score in [0, 1]
}

/** PageLinkEntry holds the related pages for a single slug */
export interface PageLinkEntry {
  slug: string; // slug of the page this entry describes
  title: string; // title of the page this entry describes
  pageType: string; // page type of the page this entry describes
  relatedPages: RelatedPage[]; // top-N related pages sorted by score descending
}

/** PageLinksIndex is the full artifact written to page-links.json */
export interface PageLinksIndex {
  generatedAt: string; // ISO timestamp of when this index was built
  totalPages: number; // number of pages included in the index
  maxRelatedPages: number; // cap used when selecting top-N related pages
  pages: Record<string, PageLinkEntry>; // slug → entry map for O(1) lookup
}

/** computeEntitySet flattens a page's taxonomy and tool references into a set of typed keys */
export function computeEntitySet(page: PageDefinition): Set<string> {
  const set = new Set<string>(); // start with empty set for this page
  for (const c of page.entities.categories) set.add(`category:${c}`); // add prefixed category ids
  for (const a of page.entities.audiences) set.add(`audience:${a}`); // add prefixed audience ids
  for (const u of page.entities.useCases) set.add(`use-case:${u}`); // add prefixed use-case ids
  for (const f of page.entities.features) set.add(`feature:${f}`); // add prefixed feature ids
  for (const p of page.entities.priceTiers) set.add(`price-tier:${p}`); // add prefixed price-tier ids
  for (const t of page.matchedToolIds) set.add(`tool:${t}`); // add prefixed tool ids
  return set; // caller uses this set for Jaccard comparison
}

/** jaccardSimilarity computes |intersection| / |union| for two sets of entity keys */
export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0; // both empty — treat as unrelated rather than identical
  let intersection = 0; // count shared elements
  for (const item of a) {
    if (b.has(item)) intersection++; // element appears in both sets
  }
  const union = a.size + b.size - intersection; // inclusion-exclusion for union size
  return union === 0 ? 0 : intersection / union; // safe division — union is 0 only if both are empty (handled above)
}

/** computeRelatedPages performs pairwise Jaccard scoring and returns the top-N per page */
export function computeRelatedPages(validPages: PageDefinition[]): PageLinksIndex {
  // Pre-compute entity sets for all pages to avoid recomputing during pairwise loop
  const entitySets = new Map<string, Set<string>>(); // slug → entity set cache
  for (const page of validPages) {
    entitySets.set(page.slug, computeEntitySet(page)); // one set per page, computed once
  }

  const pages: Record<string, PageLinkEntry> = {}; // accumulate all page link entries

  for (const page of validPages) {
    const setA = entitySets.get(page.slug)!; // entity set for current page (always present)
    const scored: RelatedPage[] = []; // candidate related pages with similarity scores

    for (const other of validPages) {
      if (other.slug === page.slug) continue; // skip self-comparison
      const setB = entitySets.get(other.slug)!; // entity set for candidate page
      const score = jaccardSimilarity(setA, setB); // compute similarity
      if (score > 0) {
        scored.push({ slug: other.slug, title: other.title, pageType: other.pageType, score }); // only include pages with non-zero overlap
      }
    }

    scored.sort((a, b) => b.score - a.score); // sort by score descending so top-N are the most similar
    const relatedPages = scored.slice(0, MAX_RELATED_PAGES); // take at most MAX_RELATED_PAGES entries

    pages[page.slug] = {
      slug: page.slug, // slug for this page entry
      title: page.title, // title for this page entry
      pageType: page.pageType, // page type for this page entry
      relatedPages, // top-N related pages for this entry
    };
  }

  return {
    generatedAt: new Date().toISOString(), // timestamp for cache-busting and audit trail
    totalPages: validPages.length, // total number of pages indexed
    maxRelatedPages: MAX_RELATED_PAGES, // cap value used when slicing scored list
    pages, // full slug-keyed map of link entries
  };
}
