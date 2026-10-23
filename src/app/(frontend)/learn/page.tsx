import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { ArrowLeft, PlayCircle, Lock, Clapperboard } from 'lucide-react'
import { getAuthContext } from '@/lib/auth'
import { isPremium } from '@/lib/quiz'
import { relName, getYouTubeId, getYouTubeThumbnail } from '@/lib/utils'

export const metadata: Metadata = { title: 'Video lessons — Prepady' }
export const dynamic = 'force-dynamic'

export default async function LearnPage() {
  const { payload, user } = await getAuthContext()
  if (!user) redirect('/login?redirect=/learn')
  const premium = isPremium(user as { plan?: string; subscriptionExpiresAt?: string })

  const res = await payload
    .find({
      collection: 'video-lessons',
      where: { status: { equals: 'published' } },
      sort: 'order',
      limit: 500,
      depth: 1,
      overrideAccess: true,
    })
    .catch(() => ({ docs: [] as Array<Record<string, unknown>> }))

  const lessons = res.docs.map((v) => ({
    id: v.id as number,
    title: String(v.title ?? 'Lesson'),
    subject: relName(v.subject),
    exam: relName(v.exam),
    isFree: !!v.isFree,
    duration: (v.durationLabel as string) ?? null,
    url: String(v.youtubeUrl ?? ''),
  }))

  // Group by subject for a tidy catalogue.
  const groups = new Map<string, typeof lessons>()
  for (const l of lessons) {
    const key = l.subject ?? 'General'
    const arr = groups.get(key) ?? []
    arr.push(l)
    groups.set(key, arr)
  }
  const grouped = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <BrandLogo className="w-7 h-7" /> Prepady<span className="text-gold-500">.</span>
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gold-700 mb-1">
          <Clapperboard className="w-4 h-4" /> Video lessons
        </p>
        <h1 className="font-display text-3xl font-extrabold text-ink-900 mb-1">Learn by watching</h1>
        <p className="text-muted-foreground mb-8">
          Concise lessons for your exam. {premium ? 'You have full access.' : 'A few are free — go Premium to unlock them all.'}
        </p>

        {lessons.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <Clapperboard className="w-9 h-9 text-gold-400 mx-auto mb-3" />
            <p className="font-display text-xl font-extrabold text-ink-900 mb-1">No lessons yet</p>
            <p className="text-muted-foreground text-sm">Video lessons are on the way — check back soon.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {grouped.map(([subject, items]) => (
              <section key={subject}>
                <h2 className="font-display text-lg font-extrabold text-ink-900 mb-4">{subject}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.map((l) => {
                    const locked = !l.isFree && !premium
                    const yt = getYouTubeId(l.url)
                    return (
                      <Link
                        key={l.id}
                        href={locked ? '/upgrade' : `/learn/${l.id}`}
                        className="group flex flex-col rounded-2xl border border-border bg-card shadow-brand overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="relative aspect-[16/9] bg-ink-900 overflow-hidden">
                          {yt ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={getYouTubeThumbnail(yt, 'hq')} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                          ) : null}
                          <div className="absolute inset-0 flex items-center justify-center">
                            {locked ? <Lock className="w-10 h-10 text-gold-400 drop-shadow" /> : <PlayCircle className="w-12 h-12 text-white/90 drop-shadow" />}
                          </div>
                          {l.isFree && <span className="absolute top-2 left-2 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-gold-400 text-ink-900">Free</span>}
                          {l.duration && <span className="absolute bottom-2 right-2 text-[11px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white">{l.duration}</span>}
                        </div>
                        <div className="p-4">
                          <p className="font-black text-ink-900 leading-snug group-hover:text-gold-700">{l.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{l.exam ?? ''}{locked ? ' · Premium' : ''}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
