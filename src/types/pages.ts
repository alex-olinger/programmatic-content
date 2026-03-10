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
  | 'introduction'
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
  canonicalKey: string;
  sourceRule: PageType;
  entities: {
    categories: string[];
    audiences: string[];
    useCases: string[];
    features: string[];
    priceTiers: string[];
  };
  matchedToolIds: string[];
  supportCount: number;
  sections: Partial<Record<SectionName, 'deterministic' | 'llm'>>;
  isValid: boolean;
  warnings: string[];
  rejectionReason?: string;
  overlapScore?: number;
}

export interface PageIndex {
  generatedAt: string;
  totalCandidates: number;
  totalValid: number;
  totalRejected: number;
  pages: PageDefinition[];
}

export interface PageDefinitionReport {
  generatedAt: string;
  totalCandidates: number;
  totalValid: number;
  totalRejected: number;
  byType: Record<string, { candidates: number; valid: number; rejected: number }>;
  rejectionsByReason: Record<string, number>;
  warningsSummary: string[];
  duplicateKeysRemoved: number;
}

export interface SitePlanSummary {
  generatedAt: string;
  totalValidPages: number;
  totalPageTypes: number;
  byType: Record<string, { count: number; slugs: string[] }>;
  toolCoverage: Record<string, number>;
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
