import fs from 'fs';
import path from 'path';
import { renderMarkdown } from '../src/lib/markdown.js';
import type { SitePlan } from '../src/types/pages.js';

const ROOT = path.resolve(process.cwd());
const CONTENT_ROOT = path.join(ROOT, 'content');
const INDEX_FILE = path.join(CONTENT_ROOT, 'index', 'page-definitions.json');
const PAGES_DIR = path.join(CONTENT_ROOT, 'pages');

function main() {
  if (!fs.existsSync(INDEX_FILE)) {
    console.error('Error: page-definitions.json not found. Run pnpm compute-pages first.');
    process.exit(1);
  }

  const sitePlan: SitePlan = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  console.log(`Reading ${sitePlan.pages.length} page definitions...`);

  fs.mkdirSync(PAGES_DIR, { recursive: true });

  let written = 0;
  for (const def of sitePlan.pages) {
    const markdown = renderMarkdown(def);
    const filePath = path.join(PAGES_DIR, `${def.slug}.md`);
    fs.writeFileSync(filePath, markdown, 'utf-8');
    written++;
  }

  console.log(`\nWrote ${written} markdown files to: ${PAGES_DIR}`);
}

main();
