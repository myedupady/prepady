import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { hexToHslTriplet } from '@/lib/color'
import 'katex/dist/katex.min.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Prepady — AI exam prep for Africa',
  description:
    'Adaptive practice tests, real past questions, and an AI tutor that explains every question — for national exams across Africa.',
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
