import Link from 'next/link' // Next.js client-side navigation link
import { loadAllPageMeta } from '@/lib/pages' // metadata loader for all generated pages
import type { PageMeta } from '@/lib/pages' // TypeScript type for page frontmatter
import { loadTopicalClusters } from '@/lib/graph-data' // cluster index loader for topic navigation
import type { TopicalClustersIndex } from '@/lib/graph-data' // type for cluster index

// Group a flat array of pages into a map keyed by pageType for sectioned display
function groupByType(pages: PageMeta[]): Record<string, PageMeta[]> {
  return pages.reduce<Record<string, PageMeta[]>>((acc, page) => {
    if (!acc[page.pageType]) acc[page.pageType] = [] // initialize bucket on first encounter
    acc[page.pageType].push(page) // add page to its type bucket
    return acc
  }, {})
}

// tryLoadClusters loads topical clusters without throwing — returns null if artifact is missing
function tryLoadClusters(): TopicalClustersIndex | null {
  try {
    return loadTopicalClusters() // may throw if topical-clusters.json has not been generated yet
  } catch {
    return null // silently degrade — cluster section is omitted when artifact is absent
  }
}

// Homepage — server component that loads all page metadata at build time
export default function HomePage() {
  const pages = loadAllPageMeta() // read frontmatter from all .md files on disk
  const grouped = groupByType(pages) // organize into sections by page family
  const typeCount = Object.keys(grouped).length // number of distinct page families
  const clusters = tryLoadClusters() // load cluster index — null if compute-graph has not run

  return (
    <main>
      <h1 style={{ marginBottom: '0.25rem' }}>AI Tools Guide</h1>
      {/* Summary line showing total pages and type count */}
      <p style={{ color: '#555', marginTop: 0 }}>
        {pages.length} pages across {typeCount} page types.
      </p>

      {/* Topic Clusters section — only rendered when topical-clusters.json is available */}
      {clusters && clusters.clusters.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.3rem', fontSize: '1.1rem', color: '#333' }}>
            Topic Clusters ({clusters.totalClusters}) {/* show count for quick orientation */}
          </h2>
          {clusters.clusters.map(cluster => (
            <div key={cluster.pillarSlug} style={{ marginTop: '1.25rem' }}>
              {/* Pillar heading links to the authoritative pillar page */}
              <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.4rem', color: '#222' }}>
                <Link href={`/${cluster.pillarSlug}`} style={{ color: '#0070f3', textDecoration: 'none' }}>
                  {cluster.pillarTitle} {/* pillar page title as cluster heading */}
                </Link>
                <span style={{ color: '#999', fontWeight: 'normal', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                  {cluster.members.length} pages {/* member count for orientation */}
                </span>
              </h3>
              <ul style={{ listStyle: 'none', paddingLeft: '1rem', margin: 0 }}>
                {cluster.members.map(member => (
                  <li key={member.slug} style={{ marginBottom: '0.25rem' }}>
                    <Link href={`/${member.slug}`} style={{ color: '#0070f3', textDecoration: 'none', fontSize: '0.9rem' }}>
                      {member.title} {/* member page title as link text */}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

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
