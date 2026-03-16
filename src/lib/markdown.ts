import type { PageDefinition } from '../types/pages.js'; // page definition type
import type { Tool } from '../types/entities.js'; // full tool object for rich output
import { generateNarrative } from './llm.js'; // async LLM narrative generator

/** yamlEscape escapes a string for safe use inside a YAML double-quoted scalar */
function yamlEscape(value: string): string {
  return value
    .replace(/\\/g, '\\\\') // escape backslashes first to avoid double-escaping
    .replace(/"/g, '\\"') // escape double quotes — required for YAML double-quoted scalars
    .replace(/\n/g, '\\n') // escape newlines — literal \n breaks YAML scalar parsing
    .replace(/\r/g, '\\r'); // escape carriage returns — same reason as \n
}

/** frontmatter renders the YAML front matter block for a page */
function frontmatter(def: PageDefinition): string {
  const entities = def.entities; // destructure for readability
  return [
    '---',
    `title: "${yamlEscape(def.title)}"`, // page title — used in <title> and og:title
    `description: "${yamlEscape(def.description)}"`, // meta description
    `slug: "${yamlEscape(def.slug)}"`, // URL slug — must match filename
    `pageType: "${yamlEscape(def.pageType)}"`, // page type — used for template selection
    `canonicalKey: "${yamlEscape(def.canonicalKey)}"`, // unique semantic identity
    `generatedAt: "${new Date().toISOString()}"`, // timestamp of this generation run
    `matchedToolIds: [${def.matchedToolIds.map((t) => `"${yamlEscape(t)}"`).join(', ')}]`, // tool IDs for frontend lookup
    'entities:', // taxonomy entity IDs scoped to this page
    `  categories: [${entities.categories.map((c) => `"${yamlEscape(c)}"`).join(', ')}]`,
    `  audiences: [${entities.audiences.map((a) => `"${yamlEscape(a)}"`).join(', ')}]`,
    `  useCases: [${entities.useCases.map((u) => `"${yamlEscape(u)}"`).join(', ')}]`,
    `  features: [${entities.features.map((f) => `"${yamlEscape(f)}"`).join(', ')}]`,
    `  priceTiers: [${entities.priceTiers.map((p) => `"${yamlEscape(p)}"`).join(', ')}]`,
    '---',
  ].join('\n');
}

/** toolListSection renders the ## Tools section using full tool data when available */
function toolListSection(def: PageDefinition, toolMap: Map<string, Tool>): string {
  const lines = ['## Tools']; // section heading — required by QA check
  for (const toolId of def.matchedToolIds) {
    const tool = toolMap.get(toolId); // resolve full tool object from map
    if (tool) {
      lines.push(`- **[${tool.name}](${tool.website})** — ${tool.tagline}`); // rich entry: name, link, tagline
    } else {
      lines.push(`- ${toolId}`); // fallback to ID if tool not found in map
    }
  }
  return lines.join('\n');
}

/** comparisonTableSection renders the ## Comparison section with real tool data */
function comparisonTableSection(def: PageDefinition, toolMap: Map<string, Tool>): string {
  if (def.pageType !== 'comparison') return ''; // only applicable to comparison pages
  if (def.matchedToolIds.length < 2) {
    return '<!-- comparison table unavailable: fewer than 2 tools -->'; // guard against malformed comparison pages
  }
  const [idA, idB] = def.matchedToolIds; // first two tools are always the comparison pair
  const toolA = toolMap.get(idA); // resolve first tool
  const toolB = toolMap.get(idB); // resolve second tool
  if (!toolA || !toolB) {
    return '<!-- comparison table unavailable: tool data missing -->'; // fallback if tools not found
  }

  // Format categories, pricing, and features as comma-separated readable strings
  const catsA = toolA.categories.join(', '); // tool A's category list
  const catsB = toolB.categories.join(', '); // tool B's category list
  const priceA = toolA.priceTiers.join(', '); // tool A's pricing tiers
  const priceB = toolB.priceTiers.join(', '); // tool B's pricing tiers
  const featsA = toolA.features.slice(0, 3).join(', '); // up to 3 key features for tool A
  const featsB = toolB.features.slice(0, 3).join(', '); // up to 3 key features for tool B

  return [
    '## Comparison',
    '',
    `| | ${toolA.name} | ${toolB.name} |`, // column headers using tool names
    '|---|---|---|',
    `| Categories | ${catsA} | ${catsB} |`, // category row
    `| Pricing | ${priceA} | ${priceB} |`, // pricing row
    `| Key Features | ${featsA} | ${featsB} |`, // features row (first 3)
    `| Website | [${toolA.name}](${toolA.website}) | [${toolB.name}](${toolB.website}) |`, // website row with links
  ].join('\n');
}

/** renderMarkdown assembles a complete markdown page for one page definition */
export async function renderMarkdown(
  def: PageDefinition,
  toolMap: Map<string, Tool>, // map from tool ID → Tool, used for rich content
  cacheDir?: string // optional path to narrative cache directory
): Promise<string> {
  // Build the NarrativeContext with full tool objects — enriches LLM prompts
  const ctx = {
    pageType: def.pageType, // determines which narrative sections are generated
    matchedToolIds: def.matchedToolIds, // tool IDs for cache key stability
    tools: def.matchedToolIds // resolved full tool objects for prompt context
      .map((id) => toolMap.get(id))
      .filter((t): t is Tool => t !== undefined), // filter out any unresolved IDs
    entities: def.entities, // taxonomy entity IDs
    title: def.title, // page title for prompts
  };

  const parts: string[] = [
    frontmatter(def), // YAML front matter block
    '',
    `# ${def.title}`, // h1 heading
    '',
    await generateNarrative('introduction', ctx, cacheDir), // LLM or placeholder intro
    '',
    toolListSection(def, toolMap), // deterministic tool list with names and links
  ];

  if (def.pageType === 'comparison') {
    parts.push('', comparisonTableSection(def, toolMap)); // comparison table with real data
  }

  parts.push(
    '',
    '## Best For',
    '',
    await generateNarrative('bestFor', ctx, cacheDir), // LLM or placeholder bestFor
  );

  if (def.pageType === 'tool-detail' || def.pageType === 'comparison') {
    parts.push(
      '',
      '## Pros and Cons',
      '',
      await generateNarrative('prosAndCons', ctx, cacheDir), // LLM or placeholder prosAndCons
    );
  }

  parts.push(
    '',
    '## FAQ',
    '',
    await generateNarrative('faq', ctx, cacheDir), // LLM or placeholder faq
  );

  return parts.join('\n'); // join all parts into the final markdown document
}
