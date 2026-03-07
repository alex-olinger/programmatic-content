import fs from 'fs';
import path from 'path';
import { validateAll } from '../src/lib/validate.js';
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
  console.log(`Checking ${validPages.length} valid page definitions (of ${index.totalCandidates} candidates)...`);

  // Load generated files
  const generatedFiles = new Map<string, string>();
  if (fs.existsSync(PAGES_DIR)) {
    for (const file of fs.readdirSync(PAGES_DIR)) {
      if (!file.endsWith('.md')) continue;
      const slug = file.replace(/\.md$/, '');
      generatedFiles.set(slug, fs.readFileSync(path.join(PAGES_DIR, file), 'utf-8'));
    }
  }
  console.log(`Found ${generatedFiles.size} generated files...`);

  const report = validateAll(validPages, generatedFiles);

  console.log(`\nQA Report`);
  console.log(`---------`);
  console.log(`Pages checked: ${report.checkedPages}`);
  console.log(`Files checked: ${report.checkedFiles}`);
  console.log(`Errors:   ${report.errors.length}`);
  console.log(`Warnings: ${report.warnings.length}`);

  if (report.errors.length > 0) {
    console.log('\nERRORS:');
    for (const e of report.errors) {
      console.log(`  [${e.slug}] ${e.message}`);
    }
  }

  if (report.warnings.length > 0) {
    console.log('\nWARNINGS:');
    for (const w of report.warnings) {
      console.log(`  [${w.slug}] ${w.message}`);
    }
  }

  if (report.errors.length === 0 && report.warnings.length === 0) {
    console.log('\nAll checks passed.');
  }

  process.exit(report.errors.length > 0 ? 1 : 0);
}

try {
  main();
} catch (err) {
  console.error('qa-check failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}
