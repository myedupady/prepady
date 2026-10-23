import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { BrandLogo } from '@/components/BrandLogo'
import { ArrowLeft, ArrowRight, Newspaper } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Blog — Prepady',
  description: 'Study tips, exam news, and updates from Prepady.',
}
export const dynamic = 'force-dynamic'

const PER_PAGE = 9

function fmtDate(d?: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)

  const payload = await getPayload({ config: configPromise })
  const res = await payload
    .find({
      collection: 'posts',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      page,
      limit: PER_PAGE,
      depth: 1,
      overrideAccess: true,
    })
    .catch(() => ({ docs: [], totalPages: 1, page: 1, hasPrevPage: false, hasNextPage: false }))

  const posts = res.docs as Array<{
    id: number
    title?: string
    slug?: string
    excerpt?: string
    author?: string
    publishedAt?: string
    coverImage?: { url?: string } | null
  }>

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <BrandLogo className="w-7 h-7" /> Prepady<span className="text-gold-500">.</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gold-700 mb-1">
          <Newspaper className="w-4 h-4" /> Prepady blog
        </p>
        <h1 className="font-display text-3xl font-extrabold text-ink-900 mb-1">Study smarter</h1>
        <p className="text-muted-foreground mb-8">Tips, exam news, and updates to help you ace your exams.</p>

        {posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <Newspaper className="w-9 h-9 text-gold-400 mx-auto mb-3" />
            <p className="font-display text-xl font-extrabold text-ink-900 mb-1">No posts yet</p>
            <p className="text-muted-foreground text-sm">New articles are on the way — check back soon.</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col rounded-2xl border border-border bg-card shadow-brand overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-[16/9] bg-ink-50 overflow-hidden">
                    {p.coverImage?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.coverImage.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><BrandLogo className="w-12 h-12 opacity-40" /></div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gold-700 mb-1">{fmtDate(p.publishedAt)}{p.author ? ` · ${p.author}` : ''}</p>
                    <h2 className="font-black text-ink-900 leading-snug mb-1 group-hover:text-gold-700">{p.title}</h2>
                    {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {((res as { totalPages?: number }).totalPages ?? 1) > 1 && (
              <div className="flex items-center justify-between mt-10">
                <Button asChild variant="outline" disabled={!(res as { hasPrevPage?: boolean }).hasPrevPage} className="rounded-xl font-bold">
                  <Link href={`/blog?page=${page - 1}`}><ArrowLeft className="w-4 h-4" /> Newer</Link>
                </Button>
                <span className="text-sm text-muted-foreground font-semibold">Page {page} of {(res as { totalPages?: number }).totalPages}</span>
                <Button asChild variant="outline" disabled={!(res as { hasNextPage?: boolean }).hasNextPage} className="rounded-xl font-bold">
                  <Link href={`/blog?page=${page + 1}`}>Older <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
