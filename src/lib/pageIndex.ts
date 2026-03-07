import fs from 'fs';
import type { PageDefinition, PageIndex, PageDefinitionReport, PageType } from '../types/pages.js';
import { MIN_TOOLS, MIN_OVERLAP_SCORE } from './pageRules.js';

/**
 * Apply threshold and overlap validation to candidates.
 * Does not overwrite existing rejections from rules (e.g., incomplete tool data).
 */
export function validateCandidates(candidates: PageDefinition[]): PageDefinition[] {
  return candidates.map((def) => {
    // Already rejected by rule-level check — preserve
    if (!def.isValid) return def;

    // Threshold check: supportCount must meet minimum for page type
    const minTools = MIN_TOOLS[def.pageType];
    if (def.supportCount < minTools) {
      return {
        ...def,
        isValid: false,
        rejectionReason: `below minimum: ${def.supportCount} tools, need >= ${minTools}`,
      };
    }

    // Comparison-specific: overlap score check
    if (def.pageType === 'comparison' && def.overlapScore !== undefined) {
      if (def.overlapScore < MIN_OVERLAP_SCORE) {
        return {
          ...def,
          isValid: false,
          rejectionReason: `insufficient overlap: score ${def.overlapScore}, need >= ${MIN_OVERLAP_SCORE}`,
        };
      }
      // Warn if overlap is modest (at threshold)
      if (def.overlapScore === MIN_OVERLAP_SCORE) {
        return {
          ...def,
          warnings: [...def.warnings, `borderline overlap score: ${def.overlapScore}`],
        };
      }
    }

    // Warn if supportCount is exactly at threshold
    if (def.supportCount === minTools && minTools > 1) {
      return {
        ...def,
        warnings: [...def.warnings, `supportCount at minimum threshold (${minTools})`],
      };
    }

    return def;
  });
}

/**
 * Deduplicate by canonical key and slug.
 * First occurrence wins; duplicates are marked rejected.
 */
export function deduplicateCandidates(
  candidates: PageDefinition[]
): { result: PageDefinition[]; duplicateKeysRemoved: number } {
  const seenKeys = new Set<string>();
  const seenSlugs = new Set<string>();
  let duplicateKeysRemoved = 0;

  const result = candidates.map((def) => {
    // Canonical key duplicate
    if (seenKeys.has(def.canonicalKey)) {
      duplicateKeysRemoved++;
      process.stderr.write(`deduplicateCandidates: dropped duplicate canonical key "${def.canonicalKey}" (${def.slug})\n`);
      return {
        ...def,
        isValid: false,
        rejectionReason: `duplicate canonical key: ${def.canonicalKey}`,
      };
    }
    seenKeys.add(def.canonicalKey);

    // Slug duplicate (different canonical key but same slug)
    if (seenSlugs.has(def.slug)) {
      process.stderr.write(`deduplicateCandidates: dropped duplicate slug "${def.slug}" (${def.canonicalKey})\n`);
      return {
        ...def,
        isValid: false,
        rejectionReason: `duplicate slug: ${def.slug}`,
        warnings: [...def.warnings, 'slug collision with another page definition'],
      };
    }
    seenSlugs.add(def.slug);

    return def;
  });

  return { result, duplicateKeysRemoved };
}

/**
 * Build the page index from processed candidates.
 */
export function buildPageIndex(candidates: PageDefinition[]): PageIndex {
  const valid = candidates.filter((d) => d.isValid);
  const rejected = candidates.filter((d) => !d.isValid);
  return {
    generatedAt: new Date().toISOString(),
    totalCandidates: candidates.length,
    totalValid: valid.length,
    totalRejected: rejected.length,
    pages: candidates,
  };
}

/**
 * Build a summary report from processed candidates.
 */
export function buildReport(
  candidates: PageDefinition[],
  duplicateKeysRemoved: number
): PageDefinitionReport {
  const valid = candidates.filter((d) => d.isValid);
  const rejected = candidates.filter((d) => !d.isValid);

  // By type
  const byType: Record<string, { candidates: number; valid: number; rejected: number }> = {};
  for (const def of candidates) {
    if (!byType[def.pageType]) {
      byType[def.pageType] = { candidates: 0, valid: 0, rejected: 0 };
    }
    byType[def.pageType].candidates++;
    if (def.isValid) {
      byType[def.pageType].valid++;
    } else {
      byType[def.pageType].rejected++;
    }
  }

  // Rejections by reason
  const rejectionsByReason: Record<string, number> = {};
  for (const def of rejected) {
    const reason = def.rejectionReason ?? 'unknown';
    rejectionsByReason[reason] = (rejectionsByReason[reason] ?? 0) + 1;
  }

  // Unique warnings
  const allWarnings = new Set<string>();
  for (const def of candidates) {
    for (const w of def.warnings) {
      allWarnings.add(`[${def.slug}] ${w}`);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalCandidates: candidates.length,
    totalValid: valid.length,
    totalRejected: rejected.length,
    byType,
    rejectionsByReason,
    warningsSummary: [...allWarnings],
    duplicateKeysRemoved,
  };
}

/**
 * Load a page index from disk.
 */
export function loadPageIndex(filePath: string): PageIndex {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch {
    throw new Error(`loadPageIndex: file not found or unreadable: ${filePath}`);
  }
  try {
    return JSON.parse(raw) as PageIndex;
  } catch {
    throw new Error(`loadPageIndex: invalid JSON in file: ${filePath}`);
  }
}

/**
 * Write a page index to disk.
 */
export function writePageIndex(filePath: string, index: PageIndex): void {
  fs.writeFileSync(filePath, JSON.stringify(index, null, 2));
}

/**
 * Write a report to disk.
 */
export function writeReport(filePath: string, report: PageDefinitionReport): void {
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
}
