import type { MetadataRoute } from 'next'

/**
 * Tell well-behaved crawlers to index only public marketing pages and stay off
 * the app, admin, and API routes (which are gated, dynamic, and cost DB/AI per
 * hit). This stops legitimate crawler load and keeps private pages unindexed.
 * (Malicious bots ignore robots.txt — that's what the Vercel Firewall rate-limit
 * rules and the per-user/budget caps are for; see docs/SECURITY.md.)
 */
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://prepady.com').replace(/\/$/, '')
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/blog', '/login', '/signup', '/privacy', '/terms'],
        disallow: ['/admin', '/api', '/dashboard', '/quiz', '/theory', '/comprehension', '/learn', '/leaderboard', '/finance', '/partner', '/billing', '/import', '/forgot-password', '/reset-password', '/verify'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
