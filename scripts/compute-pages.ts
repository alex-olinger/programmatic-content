import fs from 'fs';
import path from 'path';
import { loadData } from '../src/lib/loadData.js';
import { applyAllRules } from '../src/lib/pageRules.js';
import {
  validateCandidates,
  deduplicateCandidates,
  buildPageIndex,
  buildReport,
  writePageIndex,
  writeReport,
  buildSitePlanSummary,
  writeSitePlanSummary,
} from '../src/lib/pageIndex.js';

const ROOT = path.resolve(new URL(import.meta.url).pathname, '../../');
const CONTENT_ROOT = path.join(ROOT, 'content');
const INDEX_DIR = path.join(CONTENT_ROOT, 'index');
const INDEX_FILE = path.join(INDEX_DIR, 'page-definitions.json');
const REPORT_FILE = path.join(INDEX_DIR, 'page-definition-report.json');
const SUMMARY_FILE = path.join(INDEX_DIR, 'site-plan-summary.json');

function main() {
  console.log('Loading data...');
  const dataset = loadData(CONTENT_ROOT);
  console.log(`  tools: ${dataset.tools.length}, categories: ${dataset.categories.length}, audiences: ${dataset.audiences.length}`);

  // Guard against empty datasets — likely means data files exist but are missing content
  if (dataset.tools.length === 0 || dataset.categories.length === 0) {
    throw new Error('Dataset is empty — check content/data files contain valid entries');
  }

  console.log('Computing page candidates...');
  const rawCandidates = applyAllRules(dataset);
  console.log(`  raw candidates: ${rawCandidates.length}`);

  console.log('Validating candidates...');
  const validated = validateCandidates(rawCandidates);

  console.log('Deduplicating...');
  const { result: candidates, duplicateKeysRemoved } = deduplicateCandidates(validated);

  const valid = candidates.filter((d) => d.isValid);
  const rejected = candidates.filter((d) => !d.isValid);

  // Build and write index
  const index = buildPageIndex(candidates);
  fs.mkdirSync(INDEX_DIR, { recursive: true });
  writePageIndex(INDEX_FILE, index);

  // Build and write report
  const report = buildReport(candidates, duplicateKeysRemoved);
  writeReport(REPORT_FILE, report);

  // Build and write site-plan summary
  const summary = buildSitePlanSummary(candidates);
  writeSitePlanSummary(SUMMARY_FILE, summary);

  // Summary
  console.log(`\nPage Definition Index`);
  console.log(`---------------------`);
  console.log(`Total candidates: ${candidates.length}`);
  console.log(`Valid:            ${valid.length}`);
  console.log(`Rejected:         ${rejected.length}`);
  if (duplicateKeysRemoved > 0) {
    console.log(`Duplicate keys:   ${duplicateKeysRemoved}`);
  }

  console.log('\nBy type:');
  const byType: Record<string, { valid: number; rejected: number }> = {};
  for (const def of candidates) {
    if (!byType[def.pageType]) byType[def.pageType] = { valid: 0, rejected: 0 };
    if (def.isValid) byType[def.pageType].valid++;
    else byType[def.pageType].rejected++;
  }
  for (const [type, counts] of Object.entries(byType).sort()) {
    const parts = [`${counts.valid} valid`];
    if (counts.rejected > 0) parts.push(`${counts.rejected} rejected`);
    console.log(`  ${type}: ${parts.join(', ')}`);
  }

  if (rejected.length > 0) {
    console.log('\nRejected pages:');
    for (const def of rejected) {
      console.log(`  [${def.slug}] ${def.rejectionReason}`);
    }
  }

  console.log(`\nWrote: ${INDEX_FILE}`);
  console.log(`Wrote: ${REPORT_FILE}`);
  console.log(`Wrote: ${SUMMARY_FILE}`);
}

try {
  main();
} catch (err) {
  console.error('compute-pages failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}
