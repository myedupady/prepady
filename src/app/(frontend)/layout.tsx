import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { hexToHslTriplet } from '@/lib/color'
import 'katex/dist/katex.min.css'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://prepady.com'

// Search-engine ownership verification. Add the codes as Vercel env vars once the
// GSC / Bing accounts exist (GOOGLE_SITE_VERIFICATION, BING_SITE_VERIFICATION);
// until then these are simply omitted.
const verification: Metadata['verification'] = {
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
  ...(process.env.BING_SITE_VERIFICATION ? { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } } : {}),
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Prepady — AI exam prep for Africa',
    template: '%s · Prepady',
  },
  description:
    'Adaptive practice tests, real past questions, and an AI tutor that explains every question — for national exams across Africa.',
  keywords: ['JAMB', 'WAEC', 'NECO', 'UTME', 'past questions', 'CBT practice', 'exam prep', 'Nigeria', 'Africa'],
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    siteName: 'Prepady',
    url: SITE_URL,
    title: 'Prepady — AI exam prep for Africa',
    description:
      'Adaptive practice tests, real past questions, and an AI tutor that explains every question — for national exams across Africa.',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prepady — AI exam prep for Africa',
    description: 'Adaptive practice, real past questions, and an AI tutor for national exams across Africa.',
    images: ['/opengraph-image.png'],
  },
  manifest: '/manifest.json',
  ...(verification.google || verification.other ? { verification } : {}),
}

/**
 * Reads the admin-editable Theme global and returns a `:root` override block.
 * Converts the admin's hex values to the HSL channel triplets our CSS variables
 * expect. Doubled `:root:root` selector guarantees these win over globals.css.
 * Falls back to no overrides (globals.css defaults) if the DB is unavailable.
 */
// Cache the theme for 5 minutes so a flood of page hits (incl. crawlers/bots)
// doesn't trigger a DB round-trip each time. Admin theme edits appear within the
// window; shorten or add revalidateTag('theme') on the Theme global to taste.
const getThemeCss = unstable_cache(
  async (): Promise<string> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const t = (await payload.findGlobal({ slug: 'theme' })) as unknown as Record<string, string>
    const map: Record<string, string | undefined> = {
      '--background': t.background,
      '--foreground': t.foreground,
      '--card-foreground': t.foreground,
      '--popover-foreground': t.foreground,
      '--primary': t.primary,
      '--primary-foreground': t.primaryForeground,
      '--gold-400': t.accent,
      '--ring': t.accent,
      '--card': t.card,
      '--popover': t.card,
      '--border': t.border,
      '--input': t.border,
    }
    const decls = Object.entries(map)
      .map(([k, v]) => {
        const triplet = v ? hexToHslTriplet(v) : null
        return triplet ? `${k}:${triplet};` : ''
      })
      .join('')
    return decls ? `:root:root{${decls}}` : ''
  } catch {
    return ''
  }
  },
  ['theme-css'],
  { revalidate: 300, tags: ['theme'] },
)

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const themeCss = await getThemeCss()
  return (
    <html lang="en">
      <body className="antialiased text-foreground bg-background">
        {themeCss && <style id="prepady-theme" dangerouslySetInnerHTML={{ __html: themeCss }} />}
        {children}
      </body>
    </html>
  )
}
