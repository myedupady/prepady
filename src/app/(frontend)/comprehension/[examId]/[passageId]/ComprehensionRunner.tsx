'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, ArrowLeft, BookOpenText, CheckCircle2, XCircle, Loader2, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MathText } from '@/components/MathText'

export interface ComprehensionQuestion {
  id: number
  questionText: string
  options: string[]
  questionImageUrl?: string | null
}

interface GradedQuestion {
  id: number
  correctAnswer: string
  explanation: string | null
  isCorrect: boolean
}
interface GradeResult {
  results: GradedQuestion[]
  score: number
  total: number
  percentage: number
}

/**
 * Reads a comprehension passage and answers its linked MCQs together. Answers
 * are submitted in one batch to POST /api/comprehension/grade, which returns the
 * correct answers + explanations (never exposed before submitting).
 */
export function ComprehensionRunner({
  examId,
  passageId,
  title,
  instructions,
  passageText,
  subject,
  year,
  questions,
}: {
  examId: string
  passageId: string
  title: string
  instructions: string | null
  passageText: string
  subject: string | null
  year: number | null
  questions: ComprehensionQuestion[]
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [graded, setGraded] = useState<GradeResult | null>(null)
  const [error, setError] = useState('')

  const allAnswered = questions.every((q) => answers[q.id])
  const byId = (id: number) => graded?.results.find((r) => r.id === id)

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const r = await fetch('/api/comprehension/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          passageId,
          answers: questions.map((q) => ({ questionId: q.id, givenAnswer: answers[q.id] ?? '' })),
        }),
      })
      const data = await r.json()
      if (r.status === 401) { window.location.href = `/login?redirect=/comprehension/${examId}/${passageId}`; return }
      if (!r.ok) { setError(data.error || 'Could not submit your answers.'); return }
      setGraded(data as GradeResult)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Could not submit your answers. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function retry() {
    setAnswers({})
    setGraded(null)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const paragraphs = passageText.split(/\n{2,}/).filter((p) => p.trim())

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <GraduationCap className="w-6 h-6 text-gold-500" /> Prepady<span className="text-gold-500">.</span>
          </Link>
          <Link href={`/comprehension/${examId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
            <ArrowLeft className="w-4 h-4" /> Passages
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gold-700 mb-1">
          <BookOpenText className="w-4 h-4" /> Comprehension
        </p>
        <h1 className="font-display text-2xl font-extrabold text-ink-900 mb-1">{title}</h1>
        {(subject || year) && (
          <p className="text-xs text-muted-foreground mb-5">{[subject, year ? `${year}` : null].filter(Boolean).join(' · ')}</p>
        )}

        {graded && (
          <div className="rounded-2xl border border-border bg-card shadow-brand p-6 mb-6 text-center">
            <Sparkles className="w-8 h-8 text-gold-500 mx-auto mb-2" />
            <p className="font-display text-3xl font-extrabold text-ink-900">{graded.percentage}%</p>
            <p className="text-muted-foreground text-sm mt-1">You scored {graded.score} of {graded.total}.</p>
          </div>
        )}

        {/* The passage */}
        <article className="rounded-3xl border border-border bg-card shadow-brand p-6 sm:p-8 mb-6">
          {instructions && <p className="text-sm font-semibold text-gold-700 mb-4">{instructions}</p>}
          <div className="prose-reading space-y-4 text-[15px] leading-7 text-ink-900">
            {paragraphs.length ? paragraphs.map((p, i) => <p key={i}>{p}</p>) : <p>{passageText}</p>}
          </div>
        </article>

        {/* Questions */}
        <div className="space-y-5">
          {questions.map((q, qi) => {
            const g = byId(q.id)
            const answered = !!graded
            return (
              <div key={q.id} className="rounded-2xl border border-border bg-card p-6">
                {q.questionImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={q.questionImageUrl} alt="Question diagram" className="mb-4 max-h-80 w-auto max-w-full rounded-xl border border-border" />
                )}
                <p className="text-base font-bold text-ink-900 mb-4">
                  <span className="text-gold-700 mr-1.5">{qi + 1}.</span><MathText>{q.questionText}</MathText>
                </p>
                <div className="space-y-2.5">
                  {q.options.map((opt, oi) => {
                    const isPicked = answers[q.id] === opt
                    const isAnswer = answered && g?.correctAnswer && opt.trim().toLowerCase() === g.correctAnswer.trim().toLowerCase()
                    let cls = 'border-gray-200 hover:border-ink-900 hover:bg-ink-50 text-gray-700'
                    if (answered) {
                      if (isAnswer) cls = 'border-success bg-success/10 text-ink-900'
                      else if (isPicked) cls = 'border-destructive bg-destructive/10 text-ink-900'
                      else cls = 'border-gray-200 text-gray-400'
                    } else if (isPicked) cls = 'border-ink-900 bg-ink-50 text-ink-900'
                    return (
                      <button
                        key={oi}
                        type="button"
                        disabled={answered}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        className={`w-full flex items-center justify-between gap-3 text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all disabled:cursor-default ${cls}`}
                      >
                        <span><span className="text-gray-400 mr-2">{String.fromCharCode(65 + oi)}.</span><MathText>{opt}</MathText></span>
                        {answered && isAnswer && <CheckCircle2 className="w-5 h-5 text-success shrink-0" />}
                        {answered && isPicked && !isAnswer && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                      </button>
                    )
                  })}
                </div>
                {answered && g?.explanation && (
                  <div className="mt-4 rounded-2xl bg-gold-50 border border-gold-200 p-4">
                    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gold-700 mb-2"><Sparkles className="w-3.5 h-3.5" /> Explanation</p>
                    <p className="text-sm text-ink-900 leading-relaxed"><MathText>{g.explanation}</MathText></p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {error && <p className="text-sm text-destructive font-semibold mt-4">{error}</p>}

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {!graded ? (
            <Button onClick={submit} disabled={!allAnswered || submitting} variant="accent" className="rounded-xl font-black h-12 flex-1">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : allAnswered ? 'Submit answers' : `Answer all ${questions.length} questions`}
            </Button>
          ) : (
            <>
              <Button onClick={retry} variant="accent" className="rounded-xl font-black h-12 flex-1"><RotateCcw className="w-4 h-4" /> Try again</Button>
              <Button asChild variant="outline" className="rounded-xl font-black h-12 flex-1"><Link href={`/comprehension/${examId}`}>Another passage</Link></Button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
