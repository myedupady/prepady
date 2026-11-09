import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

// Regenerate hourly rather than binding the build to the DB.
export const revalidate = 3600

/**
 * Public sitemap for Google Search Console / Bing Webmaster. Lists the indexable
 * marketing pages plus every published blog post. The gated app (/dashboard,
 * /quiz, …) is intentionally excluded — see robots.ts.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://prepady.com').replace(/\/$/, '')

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/blog`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/signup`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/login`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  let posts: MetadataRoute.Sitemap = []
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'posts',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })
    posts = res.docs
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${base}/blog/${p.slug}`,
        lastModified: (p.updatedAt as string) ?? (p.publishedAt as string) ?? undefined,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
  } catch {
    // DB unavailable at build/runtime → still serve the static routes.
  }

  return [...staticRoutes, ...posts]
}
