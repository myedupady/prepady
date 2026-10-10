import Link from 'next/link'
import { GraduationCap, ArrowLeft, Sparkles, PenLine, ChevronRight, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface TopicCount {
  id: number
  name: string
  count: number
}
export interface SubjectGroup {
  id: number
  name: string
  count: number
  topics: TopicCount[]
}

/**
 * Exam landing: choose a subject (and optionally a topic) before practising, or
 * quick-start a mixed session across all subjects. Only subjects/topics that
 * actually have published MCQs are shown.
 */
export function SubjectPicker({
  examId,
  examName,
  country,
  subjects,
  theoryCount,
}: {
  examId: string
  examName: string
  country: string
  subjects: SubjectGroup[]
  theoryCount: number
}) {
  const totalMcq = subjects.reduce((n, s) => n + s.count, 0)

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <GraduationCap className="w-6 h-6 text-gold-500" /> Prepady<span className="text-gold-500">.</span>
          </Link>
          <Link href="/quiz" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
            <ArrowLeft className="w-4 h-4" /> All exams
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-xs font-black uppercase tracking-widest text-gold-700 mb-1">{examName}{country ? ` · ${country}` : ''}</p>
        <h1 className="font-display text-3xl font-extrabold text-ink-900 mb-1">Choose what to practise</h1>
        <p className="text-muted-foreground mb-8">Pick a subject, drill a single topic, or practise everything at once.</p>

        {totalMcq === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <Layers className="w-9 h-9 text-gold-400 mx-auto mb-3" />
            <p className="font-display text-xl font-extrabold text-ink-900 mb-1">No questions yet for {examName}</p>
            <p className="text-muted-foreground text-sm mb-6">We’re adding questions for this exam. Try another one.</p>
            <Button asChild variant="accent" className="rounded-xl font-black"><Link href="/quiz">Browse exams</Link></Button>
          </div>
        ) : (
          <>
            {/* Quick start: all subjects */}
            <Link
              href={`/quiz/${examId}?all=1`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card shadow-brand p-5 mb-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ink-900 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <p className="font-black text-ink-900">Quick practice — all subjects</p>
                  <p className="text-xs text-muted-foreground">Adaptive mix across every subject ({totalMcq} question{totalMcq === 1 ? '' : 's'}).</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </Link>

            {/* Subjects */}
            <div className="space-y-4">
              {subjects.map((s) => (
                <div key={s.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Link href={`/quiz/${examId}?subject=${s.id}`} className="font-black text-ink-900 hover:text-gold-700">
                      {s.name}
                    </Link>
                    <span className="text-xs font-semibold text-muted-foreground">{s.count} question{s.count === 1 ? '' : 's'}</span>
                  </div>
                  {s.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {s.topics.map((t) => (
                        <Link
                          key={t.id}
                          href={`/quiz/${examId}?subject=${s.id}&topic=${t.id}`}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-background hover:border-ink-900 hover:bg-ink-50 text-gray-700 transition-colors"
                        >
                          {t.name} <span className="text-gray-400">· {t.count}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  <div className="mt-3">
                    <Link href={`/quiz/${examId}?subject=${s.id}`} className="text-xs font-bold text-gold-700 hover:text-gold-800 inline-flex items-center gap-1">
                      Practise whole subject <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Theory practice entry */}
        {theoryCount > 0 && (
          <Link
            href={`/theory/${examId}`}
            className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-gold-200 bg-gold-50/60 p-5 hover:shadow-brand transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-100 flex items-center justify-center shrink-0">
                <PenLine className="w-5 h-5 text-gold-700" />
              </div>
              <div>
                <p className="font-black text-ink-900">Theory / essay practice</p>
                <p className="text-xs text-muted-foreground">Write answers and get AI marking against the scheme ({theoryCount} question{theoryCount === 1 ? '' : 's'}).</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </Link>
        )}
      </div>
    </main>
  )
}
