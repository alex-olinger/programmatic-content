import type { PageDefinition, ValidationReport, ValidationResult } from '../types/pages.js';

const REQUIRED_FRONTMATTER = ['title', 'description', 'slug', 'pageType', 'generatedAt'];

function parseFrontmatter(content: string): Record<string, string> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const result: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^"|"$/g, '');
    result[key] = val;
  }
  return result;
}

export function validateAll(
  defs: PageDefinition[],
  generatedFiles: Map<string, string>
): ValidationReport {
  const errors: ValidationResult[] = [];
  const warnings: ValidationResult[] = [];

  // 1. Duplicate slugs in page-definitions
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

  for (const def of defs) {
    // 3. Pages with zero matched tools
    if (def.entities.tools.length === 0) {
      errors.push({ slug: def.slug, level: 'error', message: 'Page has zero matched tools' });
    }

    // 6. tool-detail missing website or description
    if (def.pageType === 'tool-detail') {
      if (def.entities.tools.length === 0) {
        errors.push({ slug: def.slug, level: 'error', message: 'tool-detail has no tool entity' });
      }
    }

    // 4 & 5. Check generated file
    const content = generatedFiles.get(def.slug);
    if (!content) {
      warnings.push({ slug: def.slug, level: 'warning', message: 'No generated file found for page' });
      continue;
    }

    // 4. Invalid frontmatter
    const fm = parseFrontmatter(content);
    if (!fm) {
      errors.push({ slug: def.slug, level: 'error', message: 'Missing or malformed YAML frontmatter' });
    } else {
      for (const field of REQUIRED_FRONTMATTER) {
        if (!fm[field]) {
          errors.push({ slug: def.slug, level: 'error', message: `Frontmatter missing required field: ${field}` });
        }
      }
    }

    // 5. Empty required sections
    if (!content.includes('## Tools') || !content.includes('## FAQ')) {
      warnings.push({ slug: def.slug, level: 'warning', message: 'Missing expected section headings' });
    }
  }

  return {
    errors,
    warnings,
    checkedPages: defs.length,
    checkedFiles: generatedFiles.size,
  };
}
