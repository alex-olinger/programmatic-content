import type { PageDefinition, PageType, ValidationReport, ValidationResult } from '../types/pages.js'; // types for validation
import { MIN_TOOLS } from './pageRules.js'; // minimum tool thresholds per page type
import type { PageLinksIndex } from './pageLinks.js'; // type for related-page index (optional validation input)
import type { TopicalClustersIndex } from './topicalClusters.js'; // type for cluster index (optional validation input)
import type { EntityGraph } from './entityGraph.js'; // type for entity graph (optional validation input)
import type { Dataset } from '../types/entities.js'; // type for full dataset (optional validation input)

const REQUIRED_FRONTMATTER = ['title', 'description', 'slug', 'pageType', 'generatedAt']; // fields every page must declare

/** hasFrontmatterField checks if a YAML front matter field is present in file content */
function hasFrontmatterField(content: string, field: string): boolean {
  return content.includes(`\n${field}:`) || content.startsWith(`${field}:`); // handle first-line and subsequent-line cases
}

/** hasFrontmatter checks for the presence of a YAML front matter block */
function hasFrontmatter(content: string): boolean {
  return content.startsWith('---\n') && content.includes('\n---'); // must open and close with ---
}

/** requiredHeadingsFor returns the section headings expected for each page type */
function requiredHeadingsFor(pageType: PageType): string[] {
  const base = ['## Tools', '## FAQ']; // every page type must have Tools and FAQ sections
  if (pageType === 'comparison') return [...base, '## Comparison', '## Best For']; // comparison has Comparison + Best For
  if (pageType === 'tool-detail') return [...base, '## Best For', '## Pros and Cons']; // tool-detail has Best For + Pros and Cons
  return [...base, '## Best For']; // all other types have Best For
}

/** GraphArtifacts bundles the optional graph-layer artifacts for Phase 5 validation */
export interface GraphArtifacts {
  pageLinksIndex?: PageLinksIndex; // page-links.json — checked when present
  clustersIndex?: TopicalClustersIndex; // topical-clusters.json — checked when present
  entityGraph?: EntityGraph; // entity-graph.json — checked when present
  dataset?: Dataset; // raw dataset — used to verify graph completeness
}

export function validateAll(
  defs: PageDefinition[], // valid page definitions to check
  generatedFiles: Map<string, string>, // slug → file content for generated pages
  graphArtifacts: GraphArtifacts = {} // optional graph-layer artifacts from compute-graph
): ValidationReport {
  const errors: ValidationResult[] = []; // fatal issues — non-empty causes exit(1)
  const warnings: ValidationResult[] = []; // informational issues — do not block pipeline

  // 1. Duplicate slugs in valid definitions
  const slugCounts = new Map<string, number>(); // track slug occurrence count
  for (const def of defs) {
    slugCounts.set(def.slug, (slugCounts.get(def.slug) ?? 0) + 1); // increment count for each occurrence
  }
  for (const [slug, count] of slugCounts) {
    if (count > 1) {
      errors.push({ slug, level: 'error', message: `Duplicate slug appears ${count} times` }); // duplicate slugs are fatal
    }
  }

  // 2. Duplicate page IDs
  const idCounts = new Map<string, number>(); // track ID occurrence count
  for (const def of defs) {
    idCounts.set(def.id, (idCounts.get(def.id) ?? 0) + 1); // increment count per ID
  }
  for (const [id, count] of idCounts) {
    if (count > 1) {
      const slug = id.split(':')[1] ?? id; // extract slug from "pageType:slug" format
      errors.push({ slug, level: 'error', message: `Duplicate page ID: ${id} (${count} times)` }); // duplicate IDs are fatal
    }
  }

  // 3. Duplicate canonical keys
  const keyCounts = new Map<string, number>(); // track canonical key occurrence count
  for (const def of defs) {
    keyCounts.set(def.canonicalKey, (keyCounts.get(def.canonicalKey) ?? 0) + 1); // increment per key
  }
  for (const [key, count] of keyCounts) {
    if (count > 1) {
      errors.push({ slug: key, level: 'error', message: `Duplicate canonical key: ${key} (${count} times)` }); // duplicate keys are fatal
    }
  }

  for (const def of defs) {
    // 4. Pages with zero matched tools
    if (def.matchedToolIds.length === 0) {
      errors.push({ slug: def.slug, level: 'error', message: 'Page has zero matched tools' }); // zero-tool pages are invalid
    }

    // 5. Threshold check (safety net — should already be caught by pageIndex validation)
    const minTools = MIN_TOOLS[def.pageType]; // look up minimum for this page type
    if (def.supportCount < minTools) {
      errors.push({
        slug: def.slug,
        level: 'error',
        message: `Page type "${def.pageType}" requires >= ${minTools} tools, found ${def.supportCount}`,
      }); // below-threshold pages should not be valid — this catches regressions
    }

    // 5b. Thin content: page is at exactly the minimum threshold
    if (def.supportCount === minTools && minTools > 1) {
      warnings.push({
        slug: def.slug,
        level: 'warning',
        message: `Thin content: only ${def.supportCount} tool(s) — at minimum threshold for "${def.pageType}"`,
      }); // at-minimum pages may produce weak content
    }

    // 5c. Comparison pages must have an overlapScore — missing means validation was skipped
    if (def.pageType === 'comparison' && def.overlapScore === undefined) {
      errors.push({
        slug: def.slug,
        level: 'error',
        message: 'Comparison page missing overlapScore — overlap validation was skipped',
      }); // comparison pages always need an overlap score
    }

    // 6. Check generated file exists
    const content = generatedFiles.get(def.slug); // look up generated content by slug
    if (!content) {
      warnings.push({ slug: def.slug, level: 'warning', message: 'No generated file found for page' }); // missing file is unusual but not fatal
      continue; // skip content checks if file is absent
    }

    // 7. Invalid or missing YAML front matter
    if (!hasFrontmatter(content)) {
      errors.push({ slug: def.slug, level: 'error', message: 'Missing or malformed YAML frontmatter' }); // invalid frontmatter is fatal
    } else {
      for (const field of REQUIRED_FRONTMATTER) {
        if (!hasFrontmatterField(content, field)) {
          errors.push({ slug: def.slug, level: 'error', message: `Frontmatter missing required field: ${field}` }); // missing field is fatal
        }
      }
    }

    // 8. Expected section headings per page type
    const required = requiredHeadingsFor(def.pageType); // get expected headings for this page type
    for (const heading of required) {
      if (!content.includes(heading)) {
        warnings.push({ slug: def.slug, level: 'warning', message: `Missing expected section heading: "${heading}"` }); // missing headings warn but don't block
      }
    }
  }

  // 9. Orphan file detection — .md files with no valid page definition
  const validSlugs = new Set(defs.map((d) => d.slug)); // set of all valid slugs for O(1) lookup
  for (const slug of generatedFiles.keys()) {
    if (!validSlugs.has(slug)) {
      errors.push({ slug, level: 'error', message: 'Orphan file: no valid page definition for this slug' }); // orphan files indicate stale output
    }
  }

  // 10. Graph-layer checks — only run when artifacts are provided
  const { pageLinksIndex, clustersIndex, entityGraph, dataset } = graphArtifacts;

  if (pageLinksIndex) {
    // 10a. Every valid page must have an entry in page-links.json
    for (const def of defs) {
      if (!pageLinksIndex.pages[def.slug]) {
        warnings.push({ slug: def.slug, level: 'warning', message: 'No entry in page-links.json — run pnpm compute-graph' }); // missing entry means compute-graph was not run with this page
      }
    }

    // 10b. Every slug referenced in relatedPages frontmatter must exist as a valid page
    for (const [slug, content] of generatedFiles) {
      const match = content.match(/^relatedPages: \[([^\]]*)\]/m); // extract relatedPages YAML array line
      if (!match || !match[1].trim()) continue; // skip if field is absent or empty
      const slugs = match[1].split(',').map((s) => s.trim().replace(/^"|"$/g, '')); // parse quoted slug strings from array
      for (const relSlug of slugs) {
        if (relSlug && !validSlugs.has(relSlug)) {
          errors.push({ slug, level: 'error', message: `relatedPages references unknown slug: "${relSlug}"` }); // orphan related link — would produce broken internal link
        }
      }
    }
  }

  if (clustersIndex) {
    // 10c. Every cluster pillar slug must exist as a valid page
    for (const cluster of clustersIndex.clusters) {
      if (!validSlugs.has(cluster.pillarSlug)) {
        errors.push({ slug: cluster.pillarSlug, level: 'error', message: `Cluster pillar slug not found in valid pages` }); // stale cluster references a deleted or invalidated page
      }
    }
  }

  if (entityGraph && dataset) {
    // 10d. entity-graph.json must have nodes for every tool and category in the dataset
    for (const tool of dataset.tools) {
      const key = `tool:${tool.id}`; // expected node key for this tool
      if (!entityGraph.nodes[key]) {
        errors.push({ slug: key, level: 'error', message: `Entity graph missing node for tool: ${tool.id}` }); // tool in dataset but missing from graph — graph is stale or incomplete
      }
    }
    for (const cat of dataset.categories) {
      const key = `category:${cat.id}`; // expected node key for this category
      if (!entityGraph.nodes[key]) {
        errors.push({ slug: key, level: 'error', message: `Entity graph missing node for category: ${cat.id}` }); // category in dataset but missing from graph
      }
    }
  }

  return {
    errors, // fatal issues
    warnings, // informational issues
    checkedPages: defs.length, // number of page definitions checked
    checkedFiles: generatedFiles.size, // number of generated files checked
  };
}
