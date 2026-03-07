import type { PageDefinition, PageType, SectionName } from '../types/pages.js';

function sectionsFor(pageType: PageType): Partial<Record<SectionName, 'deterministic' | 'llm'>> {
  switch (pageType) {
    case 'comparison':
      return {
        introduction: 'llm',
        toolList: 'deterministic',
        comparisonTable: 'deterministic',
        bestFor: 'llm',
        prosAndCons: 'llm',
        faq: 'llm',
      };
    case 'tool-detail':
      return {
        introduction: 'llm',
        toolList: 'deterministic',
        bestFor: 'llm',
        prosAndCons: 'llm',
        faq: 'llm',
      };
    default:
      return {
        introduction: 'llm',
        toolList: 'deterministic',
        bestFor: 'llm',
        faq: 'llm',
      };
  }
}

export function buildPageDefinition(params: {
  slug: string;
  pageType: PageType;
  title: string;
  description: string;
  canonicalKey: string;
  matchedToolIds: string[];
  categories?: string[];
  audiences?: string[];
  useCases?: string[];
  features?: string[];
  priceTiers?: string[];
  overlapScore?: number;
  isValid?: boolean;
  warnings?: string[];
  rejectionReason?: string;
}): PageDefinition {
  return {
    id: `${params.pageType}:${params.slug}`,
    slug: params.slug,
    pageType: params.pageType,
    title: params.title,
    description: params.description,
    canonicalKey: params.canonicalKey,
    sourceRule: params.pageType,
    entities: {
      categories: params.categories ?? [],
      audiences: params.audiences ?? [],
      useCases: params.useCases ?? [],
      features: params.features ?? [],
      priceTiers: params.priceTiers ?? [],
    },
    matchedToolIds: params.matchedToolIds,
    supportCount: params.matchedToolIds.length,
    sections: sectionsFor(params.pageType),
    isValid: params.isValid ?? true,
    warnings: params.warnings ?? [],
    rejectionReason: params.rejectionReason,
    overlapScore: params.overlapScore,
  };
}
