import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { ArrowLeft, CalendarClock, ChevronRight, Layers, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LinkSpinner } from '@/components/LinkSpinner'

export interface YearSubject {
  id: number
  name: string
  count: number
}

/**
 * Past-questions step 2: after picking a year, pick a subject so each paper is
 * attempted on its own (Exam → Year → Subject), rather than every subject's
 * paper for that year being mixed into one session.
 */
export function PastYearPicker({
  examId,
  examName,
  country,
  year,
  subjects,
  totalCount,
  variants = [],
  selectedType = null,
}: {
  examId: string
  examName: string
  country: string
  year: number
  subjects: YearSubject[]
  totalCount: number
  variants?: string[]
  selectedType?: string | null
}) {
  // When a paper type is in play, carry it on every link.
  const typeQ = selectedType ? `&type=${selectedType}` : ''
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <BrandLogo className="w-7 h-7" /> Prepady<span className="text-gold-500">.</span>
          </Link>
          <Link href={`/quiz/${examId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
            <ArrowLeft className="w-4 h-4" /> All years
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gold-700 mb-1">
          <CalendarClock className="w-4 h-4" /> {examName}{country ? ` · ${country}` : ''} · Past questions
        </p>
        <h1 className="font-display text-3xl font-extrabold text-ink-900 mb-1">{year} — choose a subject</h1>
        <p className="text-muted-foreground mb-8">Each subject’s paper is attempted on its own. Pick one to begin.</p>

        {/* JAMB paper type (A–F) — pick one so option orders don't mix. */}
        {variants.length > 1 && (
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Paper type</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <Link
                  key={v}
                  href={`/quiz/${examId}?year=${year}&type=${v}`}
                  className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-colors ${
                    selectedType === v ? 'border-ink-900 bg-ink-900 text-gold-400' : 'border-border bg-card text-ink-900 hover:border-ink-900'
                  }`}
                >
                  Type {v}
                </Link>
              ))}
            </div>
          </div>
        )}

        {subjects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <Layers className="w-9 h-9 text-gold-400 mx-auto mb-3" />
            <p className="font-display text-xl font-extrabold text-ink-900 mb-1">No {year} papers yet</p>
            <p className="text-muted-foreground text-sm mb-6">Try another year for {examName}.</p>
            <Button asChild variant="accent" className="rounded-xl font-black"><Link href={`/quiz/${examId}`}>Back to years</Link></Button>
          </div>
        ) : (
          <>
            {/* Per-subject papers */}
            <div className="space-y-3">
              {subjects.map((s) => (
                <Link
                  key={s.id}
                  href={`/quiz/${examId}?year=${year}&subject=${s.id}${typeQ}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card shadow-brand p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-100 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-gold-700" />
                    </div>
                    <div>
                      <p className="font-black text-ink-900">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.count} question{s.count === 1 ? '' : 's'} · {year}</p>
                    </div>
                  </div>
                  <LinkSpinner idle={<ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />} />
                </Link>
              ))}
            </div>

            {/* Optional: all subjects mixed for this year */}
            {subjects.length > 1 && (
              <Link
                href={`/quiz/${examId}?year=${year}&all=1${typeQ}`}
                className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-dashed border-border bg-background p-5 hover:border-ink-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ink-900 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <p className="font-black text-ink-900">All subjects mixed</p>
                    <p className="text-xs text-muted-foreground">A combined {year} run across every subject ({totalCount} questions).</p>
                  </div>
                </div>
                <LinkSpinner idle={<ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />} />
              </Link>
            )}
          </>
        )}
      </div>
    </main>
  )
}
