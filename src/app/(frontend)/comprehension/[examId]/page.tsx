import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, BookOpenText, ChevronRight } from 'lucide-react'
import { getAuthContext } from '@/lib/auth'
import { relName } from '@/lib/utils'
import { LinkSpinner } from '@/components/LinkSpinner'

export const dynamic = 'force-dynamic'

/**
 * Comprehension landing for an exam: lists published reading passages. Each
 * passage opens its own flow (read + answer the linked questions together).
 */
export default async function ComprehensionListPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params

  const { payload, user } = await getAuthContext()
  if (!user) redirect(`/login?redirect=/comprehension/${examId}`)

  const exam = await payload.findByID({ collection: 'exams', id: examId, depth: 0 }).catch(() => null)
  if (!exam) notFound()
  const e = exam as { code?: string; country?: string }
  const examName = e.code ?? 'Exam'

  const res = await payload
    .find({
      collection: 'passages',
      where: { and: [{ exam: { equals: examId } }, { status: { equals: 'published' } }] },
      limit: 200,
      depth: 1,
      sort: 'order',
      overrideAccess: true,
    })
    .catch(() => ({ docs: [] as Array<Record<string, unknown>> }))

  // Count the questions attached to each passage (so empty passages are hidden).
  const passages = await Promise.all(
    res.docs.map(async (p) => {
      const c = await payload
        .count({
          collection: 'questions',
          where: { and: [{ passage: { equals: p.id } }, { status: { equals: 'published' } }] },
          overrideAccess: true,
        })
        .catch(() => ({ totalDocs: 0 }))
      return {
        id: p.id as number,
        title: String(p.title ?? 'Passage'),
        subject: relName(p.subject),
        year: typeof p.year === 'number' ? p.year : null,
        questionCount: c.totalDocs ?? 0,
      }
    }),
  )
  const withQuestions = passages.filter((p) => p.questionCount > 0)

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <BrandLogo className="w-7 h-7" /> Prepady<span className="text-gold-500">.</span>
          </Link>
          <Link href={`/quiz/${examId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-xs font-black uppercase tracking-widest text-gold-700 mb-1">{examName}{e.country ? ` · ${e.country}` : ''}</p>
        <h1 className="font-display text-3xl font-extrabold text-ink-900 mb-1">Comprehension</h1>
        <p className="text-muted-foreground mb-8">Read a passage, then answer the questions that follow.</p>

        {withQuestions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <BookOpenText className="w-9 h-9 text-gold-400 mx-auto mb-3" />
            <p className="font-display text-xl font-extrabold text-ink-900 mb-1">No comprehension passages yet</p>
            <p className="text-muted-foreground text-sm">We’re adding reading passages for this exam. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {withQuestions.map((p) => (
              <Link
                key={p.id}
                href={`/comprehension/${examId}/${p.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card shadow-brand p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-100 flex items-center justify-center shrink-0">
                    <BookOpenText className="w-5 h-5 text-gold-700" />
                  </div>
                  <div>
                    <p className="font-black text-ink-900">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {[p.subject, p.year ? `${p.year}` : null].filter(Boolean).join(' · ')}
                      {(p.subject || p.year) ? ' · ' : ''}{p.questionCount} question{p.questionCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <LinkSpinner idle={<ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
