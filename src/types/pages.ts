export type PageType =
  | 'category'
  | 'audience-category'
  | 'use-case'
  | 'audience-use-case'
  | 'feature'
  | 'pricing'
  | 'alternatives'
  | 'comparison'
  | 'tool-detail';

export type SectionName =
  | 'intro'
  | 'toolList'
  | 'comparisonTable'
  | 'bestFor'
  | 'prosAndCons'
  | 'faq';

export interface PageDefinition {
  id: string;
  slug: string;
  pageType: PageType;
  title: string;
  description: string;
  entities: {
    tools: string[];
    categories: string[];
    audiences: string[];
    useCases: string[];
    features: string[];
    priceTiers: string[];
  };
  sections: Record<SectionName, 'deterministic' | 'llm'>;
  validationStatus: 'valid' | 'warning' | 'invalid';
}

export interface SitePlan {
  generatedAt: string;
  totalPages: number;
  byType: Record<PageType, number>;
  pages: PageDefinition[];
}

export interface ValidationResult {
  slug: string;
  level: 'error' | 'warning';
  message: string;
}

export interface ValidationReport {
  errors: ValidationResult[];
  warnings: ValidationResult[];
  checkedPages: number;
  checkedFiles: number;
}
