import Anthropic from '@anthropic-ai/sdk'; // Anthropic SDK for Claude API calls
import fs from 'fs'; // Node fs for cache read/write
import path from 'path'; // Node path for cache directory resolution
import crypto from 'crypto'; // Node crypto for stable cache key hashing
import type { PageType, SectionName } from '../types/pages.js'; // page type and section name enums
import type { Tool } from '../types/entities.js'; // full tool object for context enrichment

// NarrativeContext carries all data the LLM needs to write a section
export interface NarrativeContext {
  pageType: PageType; // determines prompt style and section availability
  matchedToolIds: string[]; // tool IDs — used as part of cache key
  tools: Tool[]; // full tool objects resolved from matchedToolIds — used in prompts
  entities: { // taxonomy entity IDs scoped to this page
    categories: string[];
    audiences: string[];
    useCases: string[];
    features: string[];
    priceTiers: string[];
  };
  title: string; // page title — used in prompts and cache key
}

// NarrativeSection is the subset of SectionName values that the LLM generates
export type NarrativeSection = Extract<SectionName, 'introduction' | 'bestFor' | 'prosAndCons' | 'faq'>;

// buildPrompt constructs a focused prompt for each narrative section
function buildPrompt(section: NarrativeSection, ctx: NarrativeContext): string {
  const toolNames = ctx.tools.map((t) => t.name).join(', '); // comma-separated tool names for prompt context
  switch (section) {
    case 'introduction':
      // 2-3 sentence intro suitable for above-the-fold placement
      return `Write a 2-3 sentence introduction for an AI tools comparison page titled "${ctx.title}". Tools featured: ${toolNames}. Be helpful, specific, and direct. Return only the prose — no headers or markdown.`;
    case 'bestFor':
      // 1-2 sentence audience guidance for readers scanning the page
      return `In 1-2 sentences, explain who the tools on this page are best suited for. Page: "${ctx.title}". Tools: ${toolNames}. Be direct and practical. Return only the prose.`;
    case 'prosAndCons':
      // bulleted pros and cons using "**Pro:**" / "**Con:**" format
      return `Write a concise pros and cons section for the AI tools on this page: "${ctx.title}". Tools: ${toolNames}. Use "**Pro:**" and "**Con:**" bullet points. Include 2-3 of each.`;
    case 'faq':
      // 2-3 Q&A pairs using "**Q:**" / "**A:**" format
      return `Write 2-3 frequently asked questions and answers for a page about "${ctx.title}" featuring ${toolNames}. Use "**Q:** question" and "**A:** answer" format. Keep each answer to 1-2 sentences.`;
  }
}

// cacheKey produces a 16-char hex prefix of the SHA-256 of the normalized cache inputs
function cacheKey(section: NarrativeSection, ctx: NarrativeContext): string {
  const data = JSON.stringify({
    section, // section name — different prompts produce different content
    title: ctx.title, // page title — primary differentiator
    pageType: ctx.pageType, // affects prompt selection
    matchedToolIds: [...ctx.matchedToolIds].sort(), // sorted for stability
  });
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16); // 16 chars = 64 bits, sufficient for collision avoidance
}

// readCache returns cached narrative text or null if not cached
function readCache(cacheDir: string, key: string): string | null {
  const file = path.join(cacheDir, `${key}.txt`); // each cached narrative lives in its own .txt file
  try {
    return fs.readFileSync(file, 'utf-8'); // return cached content if present
  } catch {
    return null; // file not found or unreadable — treat as cache miss
  }
}

// writeCache persists a narrative result to the cache directory
function writeCache(cacheDir: string, key: string, content: string): void {
  fs.mkdirSync(cacheDir, { recursive: true }); // ensure cache directory exists
  fs.writeFileSync(path.join(cacheDir, `${key}.txt`), content, 'utf-8'); // write narrative text
}

// generateNarrative writes one narrative section — uses Claude if ANTHROPIC_API_KEY is set, otherwise returns a placeholder
export async function generateNarrative(
  section: NarrativeSection,
  ctx: NarrativeContext,
  cacheDir?: string // optional path to narrative cache directory
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY; // check for API key — absent means use placeholder
  if (!apiKey) {
    return `<!-- LLM_PLACEHOLDER: ${section} for "${ctx.title}" -->`; // fallback: informative placeholder for development
  }

  const key = cacheKey(section, ctx); // compute stable cache key before any I/O

  // Return cached result if available — avoids redundant API calls on re-runs
  if (cacheDir) {
    const cached = readCache(cacheDir, key);
    if (cached !== null) return cached; // cache hit — return immediately
  }

  const client = new Anthropic({ apiKey }); // instantiate Claude client with the resolved API key
  const prompt = buildPrompt(section, ctx); // build section-specific prompt

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001', // fastest and cheapest model — suitable for short prose generation
    max_tokens: 512, // sufficient for all narrative sections (intro, bestFor, prosAndCons, faq)
    messages: [{ role: 'user', content: prompt }], // single-turn conversation
  });

  // Extract text from the first content block — error-guard for unexpected response shapes
  const text =
    message.content[0]?.type === 'text'
      ? message.content[0].text
      : `<!-- LLM_ERROR: unexpected response shape for ${section} -->`; // fallback on malformed response

  if (cacheDir) writeCache(cacheDir, key, text); // persist to cache so this section isn't regenerated
  return text; // return the generated prose
}
