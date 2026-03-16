import type { Metadata } from 'next' // Next.js metadata type for <head> elements
import type { ReactNode } from 'react' // React node type for children prop

// Base metadata applied site-wide; individual pages override title via the template
export const metadata: Metadata = {
  title: { template: '%s | AI Tools Guide', default: 'AI Tools Guide' }, // page-level titles slot into '%s'
  description: 'Find and compare the best AI tools for your needs.', // fallback meta description
}

// Root HTML shell wrapping every page — minimal inline styles, no external CSS framework
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en"> {/* language attribute for accessibility and SEO */}
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif', // native system font stack
          maxWidth: '860px', // readable line length for content pages
          margin: '0 auto', // center the content column
          padding: '1rem 1.5rem', // breathing room on small viewports
          color: '#111', // near-black base text
          lineHeight: '1.6', // comfortable reading rhythm
        }}
      >
        {children} {/* each page renders into this slot */}
      </body>
    </html>
  )
}
