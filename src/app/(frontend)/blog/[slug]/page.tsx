import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { BrandLogo } from '@/components/BrandLogo'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Post = {
  id: number
  title?: string
  slug?: string
  excerpt?: string
  author?: string
  publishedAt?: string
  coverImage?: { url?: string } | null
  content?: unknown
}

async function getPost(slug: string): Promise<Post | null> {
  const payload = await getPayload({ config: configPromise })
  const res = await payload
    .find({
      collection: 'posts',
      where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })
    .catch(() => ({ docs: [] as Post[] }))
  return (res.docs[0] as Post) ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Post — Prepady' }
  return {
    title: `${post.title} — Prepady`,
    description: post.excerpt ?? undefined,
    openGraph: post.coverImage?.url ? { images: [post.coverImage.url] } : undefined,
  }
}

function fmtDate(d?: string | null) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <BrandLogo className="w-7 h-7" /> Prepady<span className="text-gold-500">.</span>
          </Link>
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
            <ArrowLeft className="w-4 h-4" /> All posts
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gold-700 mb-2">
          {fmtDate(post.publishedAt)}{post.author ? ` · ${post.author}` : ''}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink-900 mb-4">{post.title}</h1>
        {post.excerpt && <p className="text-lg text-muted-foreground mb-6">{post.excerpt}</p>}

        {post.coverImage?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage.url} alt="" className="w-full rounded-2xl border border-border mb-8" />
        )}

        <div className="prose prose-ink max-w-none prose-headings:font-display prose-headings:font-extrabold prose-a:text-gold-700 prose-img:rounded-xl">
          {post.content ? (
            <RichText data={post.content as React.ComponentProps<typeof RichText>['data']} />
          ) : null}
        </div>

        <div className="mt-12 rounded-2xl bg-ink-900 text-ink-50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-black">Ready to practise?</p>
            <p className="text-sm text-ink-300">Join free and start adaptive quizzes with an AI tutor on every question.</p>
          </div>
          <Link href="/signup" className="text-sm font-black text-gold-400 shrink-0 whitespace-nowrap">Get started →</Link>
        </div>
      </article>
    </main>
  )
}
