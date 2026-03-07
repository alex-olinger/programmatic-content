import type { Dataset, Tool } from '../types/entities.js';
import type { PageDefinition, PageType } from '../types/pages.js';
import { slugify } from './slugify.js';
import { buildPageDefinition } from './pageBuilders.js';

// Minimum supportCount (matchedToolIds.length) for a page to be valid.
// Rules emit candidates with >= 1 tool; validation rejects those below threshold.
export const MIN_TOOLS: Record<PageType, number> = {
  category: 3,
  'audience-category': 2,
  'use-case': 2,
  'audience-use-case': 2,
  feature: 3,
  pricing: 2,
  alternatives: 3,   // primary tool + at least 2 alternatives
  comparison: 2,
  'tool-detail': 1,
} as const;

export const MIN_OVERLAP_SCORE = 2;

export function computeOverlapScore(a: Tool, b: Tool): number {
  const sharedCats = a.categories.filter((c) => b.categories.includes(c)).length;
  const sharedAuds = a.audiences.filter((x) => b.audiences.includes(x)).length;
  const sharedUCs = a.useCases.filter((x) => b.useCases.includes(x)).length;
  const sharedFeats = a.features.filter((x) => b.features.includes(x)).length;
  return sharedCats + sharedAuds + sharedUCs + sharedFeats;
}

// category: best-{category}-tools
export function categoryPages(dataset: Dataset): PageDefinition[] {
  return dataset.categories.flatMap((cat) => {
    const tools = dataset.tools.filter((t) => t.categories.includes(cat.id));
    if (tools.length < 1) return [];
    return [buildPageDefinition({
      slug: `best-${cat.slug}-tools`,
      pageType: 'category',
      title: `Best ${cat.name} AI Tools`,
      description: `The best AI ${cat.name.toLowerCase()} tools compared and reviewed.`,
      canonicalKey: `category|${cat.id}`,
      matchedToolIds: tools.map((t) => t.id),
      categories: [cat.id],
    })];
  });
}

// audience-category: {category}-tools-for-{audience}
export function audienceCategoryPages(dataset: Dataset): PageDefinition[] {
  const results: PageDefinition[] = [];
  for (const cat of dataset.categories) {
    for (const aud of dataset.audiences) {
      const tools = dataset.tools.filter(
        (t) => t.categories.includes(cat.id) && t.audiences.includes(aud.id)
      );
      if (tools.length < 1) continue;
      const slug = `${cat.slug}-tools-for-${aud.slug}`;
      results.push(buildPageDefinition({
        slug,
        pageType: 'audience-category',
        title: `Best ${cat.name} AI Tools for ${aud.name}`,
        description: `Top AI ${cat.name.toLowerCase()} tools built for ${aud.name.toLowerCase()}.`,
        canonicalKey: `audience-category|${[aud.id, cat.id].sort().join('|')}`,
        matchedToolIds: tools.map((t) => t.id),
        categories: [cat.id],
        audiences: [aud.id],
      }));
    }
  }
  return results;
}

// use-case: tools-for-{use-case}
export function useCasePages(dataset: Dataset): PageDefinition[] {
  return dataset.useCases.flatMap((uc) => {
    const tools = dataset.tools.filter((t) => t.useCases.includes(uc.id));
    if (tools.length < 1) return [];
    return [buildPageDefinition({
      slug: `tools-for-${uc.slug}`,
      pageType: 'use-case',
      title: `Best AI Tools for ${uc.name}`,
      description: `The top AI tools for ${uc.name.toLowerCase()}, compared and reviewed.`,
      canonicalKey: `use-case|${uc.id}`,
      matchedToolIds: tools.map((t) => t.id),
      useCases: [uc.id],
    })];
  });
}

// audience-use-case: {use-case}-tools-for-{audience}
export function audienceUseCasePages(dataset: Dataset): PageDefinition[] {
  const results: PageDefinition[] = [];
  for (const uc of dataset.useCases) {
    for (const aud of dataset.audiences) {
      const tools = dataset.tools.filter(
        (t) => t.useCases.includes(uc.id) && t.audiences.includes(aud.id)
      );
      if (tools.length < 1) continue;
      const slug = `${uc.slug}-tools-for-${aud.slug}`;
      results.push(buildPageDefinition({
        slug,
        pageType: 'audience-use-case',
        title: `Best AI Tools for ${uc.name} — ${aud.name}`,
        description: `Top AI tools for ${uc.name.toLowerCase()} used by ${aud.name.toLowerCase()}.`,
        canonicalKey: `audience-use-case|${[aud.id, uc.id].sort().join('|')}`,
        matchedToolIds: tools.map((t) => t.id),
        audiences: [aud.id],
        useCases: [uc.id],
      }));
    }
  }
  return results;
}

// feature: tools-with-{feature}
export function featurePages(dataset: Dataset): PageDefinition[] {
  return dataset.features.flatMap((feat) => {
    const tools = dataset.tools.filter((t) => t.features.includes(feat.id));
    if (tools.length < 1) return [];
    return [buildPageDefinition({
      slug: `tools-with-${feat.slug}`,
      pageType: 'feature',
      title: `Best AI Tools with ${feat.name}`,
      description: `AI tools that include ${feat.name.toLowerCase()} features, compared.`,
      canonicalKey: `feature|${feat.id}`,
      matchedToolIds: tools.map((t) => t.id),
      features: [feat.id],
    })];
  });
}

// pricing: {price-tier}-{category}-tools
export function pricingPages(dataset: Dataset): PageDefinition[] {
  const results: PageDefinition[] = [];
  for (const tier of dataset.priceTiers) {
    for (const cat of dataset.categories) {
      const tools = dataset.tools.filter(
        (t) => t.priceTiers.includes(tier.id) && t.categories.includes(cat.id)
      );
      if (tools.length < 1) continue;
      const slug = `${tier.slug}-${cat.slug}-tools`;
      results.push(buildPageDefinition({
        slug,
        pageType: 'pricing',
        title: `Best ${tier.name} AI ${cat.name} Tools`,
        description: `Top ${tier.name.toLowerCase()} AI ${cat.name.toLowerCase()} tools available today.`,
        canonicalKey: `pricing|${[tier.id, cat.id].sort().join('|')}`,
        matchedToolIds: tools.map((t) => t.id),
        categories: [cat.id],
        priceTiers: [tier.id],
      }));
    }
  }
  return results;
}

// alternatives: alternatives-to-{tool} — requires at least 1 alt in same category
export function alternativesPages(dataset: Dataset): PageDefinition[] {
  return dataset.tools.flatMap((tool) => {
    const alts = dataset.tools.filter(
      (other) =>
        tool.alternatives.includes(other.id) &&
        other.categories.some((c) => tool.categories.includes(c))
    );
    if (alts.length < 1) return [];
    const slug = `alternatives-to-${tool.slug}`;
    return [buildPageDefinition({
      slug,
      pageType: 'alternatives',
      title: `Best Alternatives to ${tool.name}`,
      description: `Top AI tool alternatives to ${tool.name} for ${tool.categories.join(', ')}.`,
      canonicalKey: `alternatives|${tool.id}`,
      matchedToolIds: [tool.id, ...alts.map((a) => a.id)],
      categories: tool.categories,
    })];
  });
}

// comparison: {tool-a}-vs-{tool-b} — requires at least 1 shared category
export function comparisonPages(dataset: Dataset): PageDefinition[] {
  const results: PageDefinition[] = [];
  const tools = dataset.tools;
  for (let i = 0; i < tools.length; i++) {
    for (let j = i + 1; j < tools.length; j++) {
      const a = tools[i];
      const b = tools[j];
      const sharedCategories = a.categories.filter((c) => b.categories.includes(c));
      if (sharedCategories.length < 1) continue;
      const [first, second] = [a, b].sort((x, y) => x.slug.localeCompare(y.slug));
      const slug = `${first.slug}-vs-${second.slug}`;
      const sortedIds = [a.id, b.id].sort();
      const overlapScore = computeOverlapScore(a, b);
      results.push(buildPageDefinition({
        slug,
        pageType: 'comparison',
        title: `${first.name} vs ${second.name}: Which Is Better?`,
        description: `Detailed comparison of ${first.name} and ${second.name} across features, pricing, and use cases.`,
        canonicalKey: `comparison|${sortedIds[0]}|${sortedIds[1]}`,
        matchedToolIds: [first.id, second.id],
        categories: sharedCategories,
        overlapScore,
      }));
    }
  }
  return results;
}

// tool-detail: {tool}-review — emits candidate for every tool
export function toolDetailPages(dataset: Dataset): PageDefinition[] {
  return dataset.tools.map((tool) => {
    const incomplete = !tool.name || !tool.description || !tool.categories.length || !tool.website;
    return buildPageDefinition({
      slug: `${tool.slug}-review`,
      pageType: 'tool-detail',
      title: `${tool.name} Review: Features, Pricing & Alternatives`,
      description: `In-depth review of ${tool.name} — features, pricing, pros and cons, and best alternatives.`,
      canonicalKey: `tool-detail|${tool.id}`,
      matchedToolIds: [tool.id],
      categories: tool.categories,
      audiences: tool.audiences,
      useCases: tool.useCases,
      features: tool.features,
      priceTiers: tool.priceTiers,
      isValid: !incomplete,
      rejectionReason: incomplete ? 'incomplete tool data (missing name, description, categories, or website)' : undefined,
    });
  });
}

export function applyAllRules(dataset: Dataset): PageDefinition[] {
  return [
    ...categoryPages(dataset),
    ...audienceCategoryPages(dataset),
    ...useCasePages(dataset),
    ...audienceUseCasePages(dataset),
    ...featurePages(dataset),
    ...pricingPages(dataset),
    ...alternativesPages(dataset),
    ...comparisonPages(dataset),
    ...toolDetailPages(dataset),
  ];
}
