import type { PageDefinition, PageType, SectionName } from '../types/pages.js';

const DEFAULT_SECTIONS: Record<SectionName, 'deterministic' | 'llm'> = {
  intro: 'llm',
  toolList: 'deterministic',
  comparisonTable: 'deterministic',
  bestFor: 'llm',
  prosAndCons: 'llm',
  faq: 'llm',
};

export function buildPageDefinition(params: {
  slug: string;
  pageType: PageType;
  title: string;
  description: string;
  tools: string[];
  categories?: string[];
  audiences?: string[];
  useCases?: string[];
  features?: string[];
  priceTiers?: string[];
}): PageDefinition {
  return {
    id: `${params.pageType}:${params.slug}`,
    slug: params.slug,
    pageType: params.pageType,
    title: params.title,
    description: params.description,
    entities: {
      tools: params.tools,
      categories: params.categories ?? [],
      audiences: params.audiences ?? [],
      useCases: params.useCases ?? [],
      features: params.features ?? [],
      priceTiers: params.priceTiers ?? [],
    },
    sections: { ...DEFAULT_SECTIONS },
    validationStatus: 'valid',
  };
}

export function deduplicateBySlug(defs: PageDefinition[]): PageDefinition[] {
  const seen = new Set<string>();
  const result: PageDefinition[] = [];
  for (const def of defs) {
    if (!seen.has(def.slug)) {
      seen.add(def.slug);
      result.push(def);
    }
  }
  return result;
}
