import React from 'react'

/**
 * Extra links in the Payload admin nav → the student-facing app areas.
 * Rendered via admin.components.afterNavLinks. Plain anchors (full navigation)
 * since these leave the admin SPA.
 */
export function AdminNavLinks() {
  const linkStyle: React.CSSProperties = {
    display: 'block',
    padding: '0.5rem 0',
    color: 'var(--theme-elevation-800)',
    fontWeight: 600,
    textDecoration: 'none',
  }
  return (
    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--theme-elevation-150)' }}>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--theme-elevation-500)', margin: '0 0 0.25rem' }}>
        App
      </p>
      <a href="/insights" style={linkStyle}>📊 Insights</a>
      <a href="/import" style={linkStyle}>⬆️ Import questions</a>
      <a href="/finance" style={linkStyle}>💰 Finance</a>
      <a href="/dashboard" style={linkStyle}>🎓 Student dashboard</a>
      <a href="/" style={linkStyle}>🌍 Landing page</a>
    </div>
  )
}
