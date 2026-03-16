import fs from 'fs'; // Node fs for reading generated files
import path from 'path'; // Node path for resolving directories
import { fileURLToPath } from 'url'; // converts file:// URL to a cross-platform filesystem path
import { validateAll } from '../src/lib/validate.js'; // QA validation logic
import { loadPageIndex } from '../src/lib/pageIndex.js'; // page index loader
import { loadData } from '../src/lib/loadData.js'; // dataset loader for entity graph verification
import type { GraphArtifacts } from '../src/lib/validate.js'; // type for optional graph artifact bundle
import type { PageLinksIndex } from '../src/lib/pageLinks.js'; // type for related-page index
import type { TopicalClustersIndex } from '../src/lib/topicalClusters.js'; // type for cluster index
import type { EntityGraph } from '../src/lib/entityGraph.js'; // type for entity graph

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../'); // project root — fileURLToPath handles Windows drive-letter URLs correctly
const CONTENT_ROOT = path.join(ROOT, 'content'); // content/ directory
const INDEX_DIR = path.join(CONTENT_ROOT, 'index'); // content/index/ for all generated artifacts
const INDEX_FILE = path.join(INDEX_DIR, 'page-definitions.json'); // page index path
const PAGES_DIR = path.join(CONTENT_ROOT, 'pages'); // generated pages directory

/** padEnd pads a string to the target width for aligned column output */
function padEnd(s: string, width: number): string {
  return s.length >= width ? s : s + ' '.repeat(width - s.length); // pad with spaces to fill column width
}

function main() {
  if (!fs.existsSync(INDEX_FILE)) {
    console.error('Error: page-definitions.json not found. Run pnpm compute-pages first.'); // guard: index must exist
    process.exit(1);
  }

  const index = loadPageIndex(INDEX_FILE); // load the full page index
  const validPages = index.pages.filter((d) => d.isValid); // only valid pages are checked
  console.log(`Checking ${validPages.length} valid pages of ${index.totalCandidates} candidates...\n`);

  // Load all generated .md files into a map keyed by slug
  const generatedFiles = new Map<string, string>(); // slug → file content
  if (fs.existsSync(PAGES_DIR)) {
    for (const file of fs.readdirSync(PAGES_DIR)) {
      if (!file.endsWith('.md')) continue; // skip non-markdown files
      const slug = file.replace(/\.md$/, ''); // derive slug from filename
      generatedFiles.set(slug, fs.readFileSync(path.join(PAGES_DIR, file), 'utf-8')); // read and store content
    }
  }
  console.log(`Found ${generatedFiles.size} generated files.`);

  // Load graph-layer artifacts if available — compute-graph must have run first
  const graphArtifacts: GraphArtifacts = {}; // start empty; populate only what is present on disk
  const pageLinksPath = path.join(INDEX_DIR, 'page-links.json'); // expected location of page-links artifact
  const clustersPath = path.join(INDEX_DIR, 'topical-clusters.json'); // expected location of clusters artifact
  const graphPath = path.join(INDEX_DIR, 'entity-graph.json'); // expected location of graph artifact

  if (fs.existsSync(pageLinksPath)) {
    graphArtifacts.pageLinksIndex = JSON.parse(fs.readFileSync(pageLinksPath, 'utf-8')) as PageLinksIndex; // load and cast page-links index
    console.log(`Loaded page-links.json (${graphArtifacts.pageLinksIndex.totalPages} entries).`);
  }
  if (fs.existsSync(clustersPath)) {
    graphArtifacts.clustersIndex = JSON.parse(fs.readFileSync(clustersPath, 'utf-8')) as TopicalClustersIndex; // load and cast cluster index
    console.log(`Loaded topical-clusters.json (${graphArtifacts.clustersIndex.totalClusters} clusters).`);
  }
  if (fs.existsSync(graphPath)) {
    graphArtifacts.entityGraph = JSON.parse(fs.readFileSync(graphPath, 'utf-8')) as EntityGraph; // load and cast entity graph
    graphArtifacts.dataset = loadData(CONTENT_ROOT); // load dataset for graph completeness check
    console.log(`Loaded entity-graph.json (${graphArtifacts.entityGraph.nodeCount} nodes).`);
  }

  const report = validateAll(validPages, generatedFiles, graphArtifacts); // run all validation checks including graph layer

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\nQA Summary');
  console.log('──────────────────────────────');
  console.log(`Pages checked:   ${report.checkedPages}`);
  console.log(`Files checked:   ${report.checkedFiles}`);
  console.log(`Errors:          ${report.errors.length}`); // non-zero causes exit(1)
  console.log(`Warnings:        ${report.warnings.length}`); // informational only

  // ── By page type ────────────────────────────────────────────────────────────
  const byType = new Map<string, number>(); // pageType → valid page count
  for (const page of validPages) {
    byType.set(page.pageType, (byType.get(page.pageType) ?? 0) + 1); // accumulate counts per type
  }
  if (byType.size > 0) {
    console.log('\nValid pages by type:');
    for (const [type, count] of [...byType.entries()].sort()) {
      console.log(`  ${padEnd(type, 20)} ${count}`); // aligned columns for readability
    }
  }

  // ── Tool coverage ───────────────────────────────────────────────────────────
  const toolCoverage = new Map<string, number>(); // toolId → page count
  for (const page of validPages) {
    for (const toolId of page.matchedToolIds) {
      toolCoverage.set(toolId, (toolCoverage.get(toolId) ?? 0) + 1); // count pages each tool appears on
    }
  }
  if (toolCoverage.size > 0) {
    console.log('\nTool coverage (pages per tool):');
    const sorted = [...toolCoverage.entries()].sort((a, b) => b[1] - a[1]); // sort by coverage descending
    for (const [toolId, count] of sorted) {
      console.log(`  ${padEnd(toolId, 20)} ${count} pages`); // aligned columns
    }
  }

  // ── Errors ─────────────────────────────────────────────────────────────────
  if (report.errors.length > 0) {
    console.log('\nERRORS:');
    for (const e of report.errors) {
      console.log(`  [ERROR] ${e.slug}: ${e.message}`); // slug and message for easy diagnosis
    }
  }

  // ── Warnings ───────────────────────────────────────────────────────────────
  if (report.warnings.length > 0) {
    console.log('\nWARNINGS:');
    for (const w of report.warnings) {
      console.log(`  [WARN]  ${w.slug}: ${w.message}`); // slug and message for easy diagnosis
    }
  }

  // ── Final status ───────────────────────────────────────────────────────────
  if (report.errors.length === 0 && report.warnings.length === 0) {
    console.log('\nAll checks passed.'); // clean run confirmation
  } else if (report.errors.length === 0) {
    console.log('\nAll error checks passed (warnings present).'); // errors clean but warnings exist
  }

  process.exit(report.errors.length > 0 ? 1 : 0); // non-zero exit on errors — blocks CI
}

try {
  main();
} catch (err) {
  console.error('qa-check failed:', err instanceof Error ? err.message : err); // top-level error handler
  process.exit(1);
}
