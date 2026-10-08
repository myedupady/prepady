import type { MetadataRoute } from 'next'

/**
 * Tell well-behaved crawlers to index only public marketing pages and stay off
 * the app, admin, and API routes (which are gated, dynamic, and cost DB/AI per
 * hit). This stops legitimate crawler load and keeps private pages unindexed.
 * (Malicious bots ignore robots.txt — that's what the Vercel Firewall rate-limit
 * rules and the per-user/budget caps are for; see docs/SECURITY.md.)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/signup'],
        disallow: ['/admin', '/api', '/dashboard', '/quiz', '/theory', '/forgot-password', '/reset-password', '/verify'],
      },
    ],
  }
}
