import fs from 'fs' // node file system for reading .md files from disk
import path from 'path' // path utilities for building OS-safe file paths
import matter from 'gray-matter' // frontmatter parser for YAML headers in .md files
import { marked } from 'marked' // markdown-to-HTML converter
import { HIGH_PRIORITY_TYPES } from './build-priority' // tier config for hybrid rendering

// Absolute path to the generated content directory, two levels up from apps/web
const PAGES_DIR = path.join(process.cwd(), '..', '..', 'content', 'pages')

// Shape of the YAML frontmatter emitted by the content generation pipeline
export interface PageMeta {
  title: string // human-readable page title for <title> and headings
  description: string // short meta description for SEO
  slug: string // URL path segment matching the .md filename
  pageType: string // content family, e.g. "alternatives", "category", "comparison"
  canonicalKey: string // unique content-engine key for deduplication
  generatedAt: string // ISO timestamp of when the page was generated
  matchedToolIds: string[] // list of tool IDs included on this page
}

// Full page data returned when rendering a specific page — frontmatter + HTML body
export interface PageData extends PageMeta {
  html: string // markdown body converted to an HTML string
}

// Load frontmatter metadata for every generated page without parsing body content
export function loadAllPageMeta(): PageMeta[] {
  // List all markdown files in the pages directory
  const files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.md'))
  // Parse only the frontmatter block from each file, skip the body for speed
  return files.map(file => {
    const raw = fs.readFileSync(path.join(PAGES_DIR, file), 'utf-8') // read raw file
    const { data } = matter(raw) // extract YAML frontmatter as a plain object
    return data as PageMeta // cast to typed interface
  })
}

// Return every valid slug so Next.js can pre-render all pages at build time
export function loadAllSlugs(): string[] {
  // Strip the .md extension from each filename to get the slug
  return fs
    .readdirSync(PAGES_DIR)
    .filter(f => f.endsWith('.md')) // ignore any non-markdown files
    .map(f => f.replace(/\.md$/, '')) // "alternatives-to-foo.md" → "alternatives-to-foo"
}

// Return slugs for high-priority page types only — used by generateStaticParams for hybrid rendering
// Low-priority slugs are excluded here and rendered on-demand via ISR
export function loadHighPrioritySlugs(): string[] {
  const allMeta = loadAllPageMeta() // load frontmatter for every generated page
  return allMeta
    .filter(meta => HIGH_PRIORITY_TYPES.has(meta.pageType)) // keep only high-priority types
    .map(meta => meta.slug) // extract slug strings for Next.js static params
}

// Load a single page by slug, returning full metadata plus rendered HTML
export function loadPageBySlug(slug: string): PageData | null {
  const filePath = path.join(PAGES_DIR, `${slug}.md`) // build expected file path
  // Return null if no file exists for this slug — caller triggers 404
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf-8') // read the full markdown file
  const { data, content } = matter(raw) // split frontmatter from body
  const html = marked(content) as string // convert markdown body to HTML string
  return { ...(data as PageMeta), html } // merge frontmatter fields with rendered body
}
