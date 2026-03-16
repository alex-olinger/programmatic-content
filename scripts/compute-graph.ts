import fs from 'fs'; // Node fs for writing JSON artifacts
import path from 'path'; // Node path for directory resolution
import { fileURLToPath } from 'url'; // converts file:// URL to a cross-platform filesystem path
import { loadData } from '../src/lib/loadData.js'; // dataset loader for entity graph input
import { loadPageIndex } from '../src/lib/pageIndex.js'; // page index loader for valid pages
import { buildEntityGraph } from '../src/lib/entityGraph.js'; // entity graph builder
import { computeRelatedPages } from '../src/lib/pageLinks.js'; // related-page computation
import { buildTopicalClusters } from '../src/lib/topicalClusters.js'; // cluster grouping

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../'); // project root — fileURLToPath handles Windows drive-letter URLs correctly
const CONTENT_ROOT = path.join(ROOT, 'content'); // content/ directory
const INDEX_DIR = path.join(CONTENT_ROOT, 'index'); // content/index/ directory for all generated artifacts
const INDEX_FILE = path.join(INDEX_DIR, 'page-definitions.json'); // page index written by compute-pages

async function main() {
  if (!fs.existsSync(INDEX_FILE)) {
    console.error('Error: page-definitions.json not found. Run pnpm compute-pages first.'); // guard: index must precede graph
    process.exit(1);
  }

  const dataset = loadData(CONTENT_ROOT); // load full entity dataset for graph construction
  const index = loadPageIndex(INDEX_FILE); // load full page index
  const validPages = index.pages.filter((p) => p.isValid); // only valid pages participate in graph/links/clusters
  console.log(`Loaded ${validPages.length} valid pages, ${dataset.tools.length} tools.`);

  // Step 1: Build entity adjacency-list graph from dataset cross-references
  const graph = buildEntityGraph(dataset); // nodes = entities, edges = tool cross-references
  fs.writeFileSync(
    path.join(INDEX_DIR, 'entity-graph.json'), // write to content/index/
    JSON.stringify(graph, null, 2), // pretty-print for human inspection
    'utf-8'
  );
  console.log(`Entity graph: ${graph.nodeCount} nodes, ${graph.edgeCount} edges → entity-graph.json`);

  // Step 2: Compute pairwise Jaccard page similarity and select top-N related pages
  const pageLinks = computeRelatedPages(validPages); // O(n²) pairwise comparison — n ≈ 190
  fs.writeFileSync(
    path.join(INDEX_DIR, 'page-links.json'), // write to content/index/
    JSON.stringify(pageLinks, null, 2), // pretty-print for human inspection
    'utf-8'
  );
  const totalRelated = Object.values(pageLinks.pages).reduce(
    (sum, entry) => sum + entry.relatedPages.length, // sum related page counts across all entries
    0
  );
  const avgRelated = pageLinks.totalPages > 0 ? (totalRelated / pageLinks.totalPages).toFixed(1) : '0'; // avoid division by zero
  console.log(`Page links: ${pageLinks.totalPages} pages, avg ${avgRelated} related per page → page-links.json`);

  // Step 3: Group pages into pillar + cluster structure for topical navigation
  const clusters = buildTopicalClusters(validPages); // pillars are category and use-case pages
  fs.writeFileSync(
    path.join(INDEX_DIR, 'topical-clusters.json'), // write to content/index/
    JSON.stringify(clusters, null, 2), // pretty-print for human inspection
    'utf-8'
  );
  console.log(`Topical clusters: ${clusters.totalClusters} clusters → topical-clusters.json`);
}

main().catch((err) => {
  console.error('compute-graph failed:', err instanceof Error ? err.message : err); // top-level error handler
  process.exit(1);
});
