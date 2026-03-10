import type { PageDefinition, PageType, ValidationReport, ValidationResult } from '../types/pages.js';
import { MIN_TOOLS } from './pageRules.js';

const REQUIRED_FRONTMATTER = ['title', 'description', 'slug', 'pageType', 'generatedAt'];

function hasFrontmatterField(content: string, field: string): boolean {
  return content.includes(`\n${field}:`) || content.startsWith(`${field}:`);
}

function hasFrontmatter(content: string): boolean {
  return content.startsWith('---\n') && content.includes('\n---');
}

export function validateAll(
  defs: PageDefinition[],
  generatedFiles: Map<string, string>
): ValidationReport {
  const errors: ValidationResult[] = [];
  const warnings: ValidationResult[] = [];

  // 1. Duplicate slugs in valid definitions
  const slugCounts = new Map<string, number>();
  for (const def of defs) {
    slugCounts.set(def.slug, (slugCounts.get(def.slug) ?? 0) + 1);
  }
  for (const [slug, count] of slugCounts) {
    if (count > 1) {
      errors.push({ slug, level: 'error', message: `Duplicate slug appears ${count} times` });
    }
  }

  // 2. Duplicate page IDs
  const idCounts = new Map<string, number>();
  for (const def of defs) {
    idCounts.set(def.id, (idCounts.get(def.id) ?? 0) + 1);
  }
  for (const [id, count] of idCounts) {
    if (count > 1) {
      const slug = id.split(':')[1] ?? id;
      errors.push({ slug, level: 'error', message: `Duplicate page ID: ${id} (${count} times)` });
    }
  }

  // 3. Duplicate canonical keys
  const keyCounts = new Map<string, number>();
  for (const def of defs) {
    keyCounts.set(def.canonicalKey, (keyCounts.get(def.canonicalKey) ?? 0) + 1);
  }
  for (const [key, count] of keyCounts) {
    if (count > 1) {
      errors.push({ slug: key, level: 'error', message: `Duplicate canonical key: ${key} (${count} times)` });
    }
  }

  for (const def of defs) {
    // 4. Pages with zero matched tools
    if (def.matchedToolIds.length === 0) {
      errors.push({ slug: def.slug, level: 'error', message: 'Page has zero matched tools' });
    }

    // 5. Threshold check (safety net — should be caught by pageIndex validation)
    const minTools = MIN_TOOLS[def.pageType as PageType];
    if (minTools !== undefined && def.supportCount < minTools) {
      errors.push({
        slug: def.slug,
        level: 'error',
        message: `Page type "${def.pageType}" requires >= ${minTools} tools, found ${def.supportCount}`,
      });
    }

    // 6. Check generated file
    const content = generatedFiles.get(def.slug);
    if (!content) {
      warnings.push({ slug: def.slug, level: 'warning', message: 'No generated file found for page' });
      continue;
    }

    // 7. Invalid frontmatter
    if (!hasFrontmatter(content)) {
      errors.push({ slug: def.slug, level: 'error', message: 'Missing or malformed YAML frontmatter' });
    } else {
      for (const field of REQUIRED_FRONTMATTER) {
        if (!hasFrontmatterField(content, field)) {
          errors.push({ slug: def.slug, level: 'error', message: `Frontmatter missing required field: ${field}` });
        }
      }
    }

    // 8. Empty required sections
    if (!content.includes('## Tools') || !content.includes('## FAQ')) {
      warnings.push({ slug: def.slug, level: 'warning', message: 'Missing expected section headings' });
    }
  }

  // 9. Orphan file detection: .md files that have no corresponding valid page
  const validSlugs = new Set(defs.map((d) => d.slug));
  for (const slug of generatedFiles.keys()) {
    if (!validSlugs.has(slug)) {
      errors.push({ slug, level: 'error', message: 'Orphan file: no valid page definition for this slug' });
    }
  }

  return {
    errors,
    warnings,
    checkedPages: defs.length,
    checkedFiles: generatedFiles.size,
  };
}
