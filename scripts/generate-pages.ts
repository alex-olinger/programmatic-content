import fs from 'fs';
import path from 'path';
import { renderMarkdown } from '../src/lib/markdown.js';
import { loadPageIndex } from '../src/lib/pageIndex.js';

const ROOT = path.resolve(new URL(import.meta.url).pathname, '../../');
const CONTENT_ROOT = path.join(ROOT, 'content');
const INDEX_FILE = path.join(CONTENT_ROOT, 'index', 'page-definitions.json');
const PAGES_DIR = path.join(CONTENT_ROOT, 'pages');

function main() {
  if (!fs.existsSync(INDEX_FILE)) {
    console.error('Error: page-definitions.json not found. Run pnpm compute-pages first.');
    process.exit(1);
  }

  const index = loadPageIndex(INDEX_FILE);
  const validPages = index.pages.filter((d) => d.isValid);
  console.log(`Reading ${index.totalCandidates} candidates (${validPages.length} valid)...`);

  fs.mkdirSync(PAGES_DIR, { recursive: true });

  let written = 0;
  for (const def of validPages) {
    const markdown = renderMarkdown(def);
    const filePath = path.join(PAGES_DIR, `${def.slug}.md`);
    fs.writeFileSync(filePath, markdown, 'utf-8');
    written++;
  }

  console.log(`\nWrote ${written} markdown files to: ${PAGES_DIR}`);
}

try {
  main();
} catch (err) {
  console.error('generate-pages failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}
