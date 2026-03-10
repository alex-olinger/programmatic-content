import type { PageType, SectionName } from '../types/pages.js';

export interface NarrativeContext {
  pageType: PageType;
  matchedToolIds: string[];
  entities: {
    categories: string[];
    audiences: string[];
    useCases: string[];
    features: string[];
    priceTiers: string[];
  };
  title: string;
}

export type NarrativeSection = Extract<SectionName, 'introduction' | 'bestFor' | 'prosAndCons' | 'faq'>;

// Default: placeholder text. Swap implementation for real Claude/OpenAI integration.
export function generateNarrative(section: NarrativeSection, ctx: NarrativeContext): string {
  return `<!-- LLM_PLACEHOLDER: ${section} for "${ctx.title}" -->`;
}
