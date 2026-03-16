import Link from 'next/link' // Next.js client-side navigation link
import { loadAllPageMeta } from '@/lib/pages' // metadata loader for all generated pages
import type { PageMeta } from '@/lib/pages' // TypeScript type for page frontmatter

// Group a flat array of pages into a map keyed by pageType for sectioned display
function groupByType(pages: PageMeta[]): Record<string, PageMeta[]> {
  return pages.reduce<Record<string, PageMeta[]>>((acc, page) => {
    if (!acc[page.pageType]) acc[page.pageType] = [] // initialize bucket on first encounter
    acc[page.pageType].push(page) // add page to its type bucket
    return acc
  }, {})
}

// Homepage — server component that loads all page metadata at build time
export default function HomePage() {
  const pages = loadAllPageMeta() // read frontmatter from all .md files on disk
  const grouped = groupByType(pages) // organize into sections by page family
  const typeCount = Object.keys(grouped).length // number of distinct page families

  return (
    <main>
      <h1 style={{ marginBottom: '0.25rem' }}>AI Tools Guide</h1>
      {/* Summary line showing total pages and type count */}
      <p style={{ color: '#555', marginTop: 0 }}>
        {pages.length} pages across {typeCount} page types.
      </p>

      {/* One section per page type, sorted alphabetically by type name */}
      {Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b)) // consistent display order
        .map(([type, group]) => (
          <section key={type} style={{ marginTop: '2rem' }}>
            {/* Section header with human-readable type name and page count */}
            <h2
              style={{
                textTransform: 'capitalize', // "audience-category" → "Audience-Category"
                borderBottom: '1px solid #eee', // visual separator
                paddingBottom: '0.3rem',
                fontSize: '1.1rem',
                color: '#333',
              }}
            >
              {type.replace(/-/g, ' ')} ({group.length}) {/* replace hyphens for readability */}
            </h2>

            <ul style={{ listStyle: 'none', paddingLeft: 0, margin: '0.5rem 0 0' }}>
              {group
                .sort((a, b) => a.title.localeCompare(b.title)) // alphabetical within each group
                .map(page => (
                  <li key={page.slug} style={{ marginBottom: '0.35rem' }}>
                    {/* Link navigates to the dynamic [slug] route */}
                    <Link
                      href={`/${page.slug}`}
                      style={{ color: '#0070f3', textDecoration: 'none' }}
                    >
                      {page.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
    </main>
  )
}
