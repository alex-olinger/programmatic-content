// Custom 404 page rendered for any route that doesn't match a generated slug
export default function NotFound() {
  return (
    <main>
      <h1>404 — Page Not Found</h1>
      {/* Explain why this happens — slug not in the site plan */}
      <p style={{ color: '#555' }}>
        This slug does not match any page in the site plan.
      </p>
      {/* Single escape hatch back to the homepage */}
      <p>
        <a href="/" style={{ color: '#0070f3' }}>
          ← Back to all pages
        </a>
      </p>
    </main>
  )
}
