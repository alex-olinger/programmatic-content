import type { PageDefinition } from '../types/pages.js';
import { generateNarrative } from './llm.js';

function frontmatter(def: PageDefinition): string {
  const entities = def.entities;
  return [
    '---',
    `title: "${def.title}"`,
    `description: "${def.description}"`,
    `slug: "${def.slug}"`,
    `pageType: "${def.pageType}"`,
    `canonicalKey: "${def.canonicalKey}"`,
    `generatedAt: "${new Date().toISOString()}"`,
    `matchedToolIds: [${def.matchedToolIds.map((t) => `"${t}"`).join(', ')}]`,
    'entities:',
    `  categories: [${entities.categories.map((c) => `"${c}"`).join(', ')}]`,
    `  audiences: [${entities.audiences.map((a) => `"${a}"`).join(', ')}]`,
    `  useCases: [${entities.useCases.map((u) => `"${u}"`).join(', ')}]`,
    `  features: [${entities.features.map((f) => `"${f}"`).join(', ')}]`,
    `  priceTiers: [${entities.priceTiers.map((p) => `"${p}"`).join(', ')}]`,
    '---',
  ].join('\n');
}

function toolListSection(def: PageDefinition): string {
  // [DETERMINISTIC]
  const lines = [`## Tools`];
  for (const tool of def.matchedToolIds) {
    lines.push(`- ${tool}`);
  }
  return lines.join('\n');
}

function comparisonTableSection(def: PageDefinition): string {
  // [DETERMINISTIC]
  if (def.pageType !== 'comparison') return '';
  if (def.matchedToolIds.length < 2) {
    return '<!-- comparison table unavailable: fewer than 2 tools -->';
  }
  const [a, b] = def.matchedToolIds;
  return [
    '## Comparison',
    '',
    `| Feature | ${a} | ${b} |`,
    '|---------|---------|---------|',
    '| Categories | see data | see data |',
    '| Pricing | see data | see data |',
  ].join('\n');
}

export function renderMarkdown(def: PageDefinition): string {
  const ctx = {
    pageType: def.pageType,
    matchedToolIds: def.matchedToolIds,
    entities: def.entities,
    title: def.title,
  };

  const parts: string[] = [
    frontmatter(def),
    '',
    `# ${def.title}`,
    '',
    // [LLM PLACEHOLDER]
    generateNarrative('introduction', ctx),
    '',
    toolListSection(def),
  ];

  if (def.pageType === 'comparison') {
    parts.push('', comparisonTableSection(def));
  }

  parts.push(
    '',
    '## Best For',
    '',
    // [LLM PLACEHOLDER]
    generateNarrative('bestFor', ctx),
  );

  if (def.pageType === 'tool-detail' || def.pageType === 'comparison') {
    parts.push(
      '',
      '## Pros and Cons',
      '',
      // [LLM PLACEHOLDER]
      generateNarrative('prosAndCons', ctx),
    );
  }

  parts.push(
    '',
    '## FAQ',
    '',
    // [LLM PLACEHOLDER]
    generateNarrative('faq', ctx),
  );

  return parts.filter((p) => p !== undefined).join('\n');
}
