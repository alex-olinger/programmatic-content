import fs from 'fs';
import path from 'path';
import { loadData } from '../src/lib/loadData.js';
import { applyAllRules } from '../src/lib/pageRules.js';
import { deduplicateBySlug } from '../src/lib/pageBuilders.js';
import type { SitePlan, PageType } from '../src/types/pages.js';

const ROOT = path.resolve(process.cwd());
const CONTENT_ROOT = path.join(ROOT, 'content');
const INDEX_DIR = path.join(CONTENT_ROOT, 'index');
const OUTPUT_FILE = path.join(INDEX_DIR, 'page-definitions.json');

function main() {
  console.log('Loading data...');
  const dataset = loadData(CONTENT_ROOT);
  console.log(`  tools: ${dataset.tools.length}, categories: ${dataset.categories.length}, audiences: ${dataset.audiences.length}`);

  console.log('Applying page rules...');
  const rawDefs = applyAllRules(dataset);

  console.log('Deduplicating...');
  const defs = deduplicateBySlug(rawDefs);

  // Count by type
  const byType: Record<string, number> = {};
  for (const def of defs) {
    byType[def.pageType] = (byType[def.pageType] ?? 0) + 1;
  }

  const sitePlan: SitePlan = {
    generatedAt: new Date().toISOString(),
    totalPages: defs.length,
    byType: byType as Record<PageType, number>,
    pages: defs,
  };

  fs.mkdirSync(INDEX_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sitePlan, null, 2));

  console.log(`\nGenerated ${defs.length} page definitions`);
  console.log('By type:');
  for (const [type, count] of Object.entries(byType).sort()) {
    console.log(`  ${type}: ${count}`);
  }
  console.log(`\nWrote: ${OUTPUT_FILE}`);
}

main();
