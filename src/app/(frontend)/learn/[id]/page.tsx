import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { ArrowLeft, Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAuthContext } from '@/lib/auth'
import { isPremium } from '@/lib/quiz'
import { relName, getVideoEmbedUrl } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { payload, user } = await getAuthContext()
  if (!user) redirect(`/login?redirect=/learn/${id}`)
  const premium = isPremium(user as { plan?: string; subscriptionExpiresAt?: string })

  const lesson = await payload.findByID({ collection: 'video-lessons', id, depth: 1 }).catch(() => null)
  if (!lesson || (lesson as { status?: string }).status !== 'published') notFound()
  const l = lesson as { title?: string; youtubeUrl?: string; isFree?: boolean; description?: string; subject?: unknown; exam?: unknown }

  const locked = !l.isFree && !premium
  const embed = getVideoEmbedUrl(l.youtubeUrl ?? '')

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <BrandLogo className="w-7 h-7" /> Prepady<span className="text-gold-500">.</span>
          </Link>
          <Link href="/learn" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
            <ArrowLeft className="w-4 h-4" /> All lessons
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <p className="text-xs font-black uppercase tracking-widest text-gold-700 mb-1">
          {relName(l.exam) ?? 'Lesson'}{relName(l.subject) ? ` · ${relName(l.subject)}` : ''}
        </p>
        <h1 className="font-display text-2xl font-extrabold text-ink-900 mb-5">{l.title}</h1>

        {locked ? (
          <div className="rounded-3xl border-2 border-dashed border-gold-300 bg-gold-50/60 p-10 text-center">
            <Lock className="w-10 h-10 text-gold-600 mx-auto mb-3" />
            <p className="font-display text-xl font-extrabold text-ink-900 mb-1">This lesson is for Premium</p>
            <p className="text-muted-foreground text-sm mb-6">Unlock every video lesson, unlimited AI help and full mocks.</p>
            <Button asChild variant="accent" className="rounded-xl font-black"><Link href="/upgrade"><Sparkles className="w-4 h-4" /> See plans</Link></Button>
          </div>
        ) : embed ? (
          <div className="relative w-full overflow-hidden rounded-2xl border border-border" style={{ aspectRatio: '16 / 9' }}>
            <iframe
              src={embed}
              title={l.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        ) : (
          <a href={l.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-bold text-gold-700 hover:text-gold-800">
            Open video ↗
          </a>
        )}

        {l.description && !locked && <p className="text-muted-foreground mt-6 leading-relaxed whitespace-pre-line">{l.description}</p>}
      </div>
    </main>
  )
}
