import fs from 'fs'; // Node fs for file operations
import path from 'path'; // Node path for directory resolution
import { renderMarkdown } from '../src/lib/markdown.js'; // async markdown renderer
import { loadPageIndex } from '../src/lib/pageIndex.js'; // page index loader
import { loadData } from '../src/lib/loadData.js'; // dataset loader for tool map
import type { Tool } from '../src/types/entities.js'; // Tool type for the tool map

const ROOT = path.resolve(new URL(import.meta.url).pathname, '../../'); // project root via import.meta.url
const CONTENT_ROOT = path.join(ROOT, 'content'); // content/ directory
const INDEX_FILE = path.join(CONTENT_ROOT, 'index', 'page-definitions.json'); // page index path
const PAGES_DIR = path.join(CONTENT_ROOT, 'pages'); // output directory for generated markdown
const CACHE_DIR = path.join(CONTENT_ROOT, 'cache', 'narratives'); // LLM narrative cache directory

async function main() {
  if (!fs.existsSync(INDEX_FILE)) {
    console.error('Error: page-definitions.json not found. Run pnpm compute-pages first.'); // guard: index must exist
    process.exit(1);
  }

  const index = loadPageIndex(INDEX_FILE); // load the full page index from disk
  const validPages = index.pages.filter((d) => d.isValid); // only valid pages get generated
  console.log(`Reading ${index.totalCandidates} candidates (${validPages.length} valid)...`);

  // Build tool map from dataset for rich content in tool lists and comparison tables
  const dataset = loadData(CONTENT_ROOT); // load full dataset including all tool objects
  const toolMap = new Map<string, Tool>(dataset.tools.map((t) => [t.id, t])); // index tools by ID for O(1) lookup
  console.log(`Loaded ${toolMap.size} tools for content enrichment.`);

  // Indicate whether LLM generation is active or using placeholders
  const usingLLM = !!process.env.ANTHROPIC_API_KEY; // true if API key is present
  console.log(`LLM narrative: ${usingLLM ? `enabled (cache: ${CACHE_DIR})` : 'disabled (placeholders)'}`);

  fs.mkdirSync(PAGES_DIR, { recursive: true }); // ensure pages directory exists

  // Remove stale .md files from previous runs before writing new ones
  for (const file of fs.readdirSync(PAGES_DIR)) {
    if (file.endsWith('.md')) {
      fs.unlinkSync(path.join(PAGES_DIR, file)); // delete stale file
    }
  }

  let written = 0; // track number of files written
  for (const def of validPages) {
    const markdown = await renderMarkdown(def, toolMap, CACHE_DIR); // async render with tool enrichment and caching
    const filePath = path.join(PAGES_DIR, `${def.slug}.md`); // output path derived from slug
    fs.writeFileSync(filePath, markdown, 'utf-8'); // write rendered markdown to disk
    written++;
  }

  console.log(`\nWrote ${written} markdown files to: ${PAGES_DIR}`); // confirm output
}

main().catch((err) => {
  console.error('generate-pages failed:', err instanceof Error ? err.message : err); // top-level error handler
  process.exit(1);
});
