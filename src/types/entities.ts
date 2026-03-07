export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  tagline: string;
  website: string;
  categories: string[];
  audiences: string[];
  useCases: string[];
  features: string[];
  priceTiers: string[];
  integrations: string[];
  alternatives: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Audience {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface UseCase {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Feature {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface PriceTier {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Integration {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Dataset {
  tools: Tool[];
  categories: Category[];
  audiences: Audience[];
  useCases: UseCase[];
  features: Feature[];
  priceTiers: PriceTier[];
  integrations: Integration[];
}
