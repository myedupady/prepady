'use client'

import { useState } from 'react'
import { BrandLogo } from '@/components/BrandLogo'
import Link from 'next/link'
import { Sparkles, Loader2, Lock, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MathText } from '@/components/MathText'

export interface TheoryQuestion {
  id: number
  questionText: string
  topic: string | null
  maxMarks: number
  questionImageUrl?: string | null
}

interface MarkResult {
  score: number
  maxMarks: number
  verdict: 'excellent' | 'good' | 'fair' | 'weak'
  strengths: string[]
  improvements: string[]
  summary: string
}

const VERDICT_STYLE: Record<MarkResult['verdict'], { label: string; cls: string }> = {
  excellent: { label: 'Excellent', cls: 'text-success' },
  good: { label: 'Good', cls: 'text-success' },
  fair: { label: 'Fair', cls: 'text-gold-700' },
  weak: { label: 'Needs work', cls: 'text-destructive' },
}

export function TheoryRunner({
  examId,
  examName,
  country,
  premium,
  questions,
}: {
  examId: string
  examName: string
  country: string
  premium: boolean
  questions: TheoryQuestion[]
}) {
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<MarkResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)

  const question = questions[index]

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <BrandLogo className="w-7 h-7" /> Prepady<span className="text-gold-500">.</span>
          </Link>
          <Link href={`/quiz/${examId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
            <ArrowLeft className="w-4 h-4" /> MCQ practice
          </Link>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-6 py-8">{children}</div>
    </main>
  )

  if (questions.length === 0) {
    return (
      <Shell>
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <PenLine className="w-9 h-9 text-gold-400 mx-auto mb-3" />
          <p className="font-display text-xl font-extrabold text-ink-900 mb-1">No theory questions yet for {examName}</p>
          <p className="text-muted-foreground text-sm mb-6">We’re adding essay questions for this exam. Try MCQ practice meanwhile.</p>
          <Button asChild variant="accent" className="rounded-xl font-black"><Link href={`/quiz/${examId}`}>MCQ practice</Link></Button>
        </div>
      </Shell>
    )
  }

  async function submit() {
    if (!question || submitting) return
    if (answer.trim().length < 2) {
      setError('Please write an answer before submitting.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const r = await fetch('/api/ai/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ questionId: question.id, answer }),
      })
      const data = await r.json().catch(() => ({}))
      if (r.status === 401) { window.location.href = `/login?redirect=/theory/${examId}`; return }
      if (r.status === 403 && data.requiresUpgrade) { setLocked(true); return }
      if (!r.ok) { setError(data.error || 'Could not mark your answer.'); return }
      setResult(data.result as MarkResult)
    } catch {
      setError('Could not mark your answer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function nextQuestion() {
    setResult(null)
    setAnswer('')
    setError(null)
    setIndex((i) => Math.min(questions.length - 1, i + 1))
  }

  if (locked) {
    return (
      <Shell>
        <div className="rounded-3xl border-2 border-dashed border-gold-300 bg-gold-50/60 p-10 text-center">
          <Lock className="w-8 h-8 text-gold-600 mx-auto mb-3" />
          <p className="font-display text-xl font-extrabold text-ink-900 mb-1">Essay marking is a Premium feature</p>
          <p className="text-muted-foreground text-sm mb-6">Upgrade to get your theory answers marked against the scheme, with strengths and gaps.</p>
          <Button asChild variant="accent" className="rounded-xl font-black"><Link href="/upgrade">See plans</Link></Button>
        </div>
      </Shell>
    )
  }

  const pct = result && result.maxMarks > 0 ? Math.round((result.score / result.maxMarks) * 100) : 0

  return (
    <Shell>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-black uppercase tracking-widest text-gold-700">
          {examName}{country ? ` · ${country}` : ''} · Theory
        </span>
        <span className="text-xs font-semibold text-muted-foreground">{index + 1} / {questions.length}</span>
      </div>

      {!premium && (
        <div className="mb-5 flex items-start gap-2 rounded-xl bg-gold-50 border border-gold-200 px-4 py-3 text-sm text-ink-900">
          <Lock className="w-4 h-4 text-gold-600 mt-0.5 shrink-0" />
          <span>You can read and attempt these, but AI marking requires <Link href="/dashboard" className="font-bold underline">Premium</Link>.</span>
        </div>
      )}

      {question && (
        <div className="rounded-3xl border border-border bg-card shadow-brand p-6 sm:p-8">
          {question.topic && <p className="text-xs font-semibold text-muted-foreground mb-2">{question.topic}</p>}
          {question.questionImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={question.questionImageUrl} alt="Question diagram" className="mb-3 max-h-80 w-auto max-w-full rounded-xl border border-border" />
          )}
          <p className="text-lg font-bold text-ink-900 mb-1"><MathText>{question.questionText}</MathText></p>
          <p className="text-xs text-muted-foreground mb-5">{question.maxMarks} mark{question.maxMarks === 1 ? '' : 's'}</p>

          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={!!result}
            rows={8}
            placeholder="Write your answer here…"
            className="w-full"
          />

          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-destructive font-medium">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {!result ? (
            <Button onClick={submit} disabled={submitting} className="w-full rounded-xl font-black h-12 mt-5">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Mark my answer</>}
            </Button>
          ) : (
            <div className="mt-6">
              <div className="flex items-center gap-4 rounded-2xl bg-ink-50 border border-border p-4 mb-4">
                <div className="text-center shrink-0">
                  <p className="font-display text-3xl font-extrabold text-ink-900 leading-none">{result.score}<span className="text-base text-muted-foreground">/{result.maxMarks}</span></p>
                  <p className={`text-xs font-black uppercase tracking-widest mt-1 ${VERDICT_STYLE[result.verdict].cls}`}>{VERDICT_STYLE[result.verdict].label}</p>
                </div>
                <p className="text-sm text-ink-900 leading-relaxed"><MathText>{result.summary}</MathText></p>
              </div>

              {result.strengths.length > 0 && (
                <div className="mb-3">
                  <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-success mb-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> What you got right</p>
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => <li key={i} className="text-sm text-ink-900 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-success"><MathText>{s}</MathText></li>)}
                  </ul>
                </div>
              )}
              {result.improvements.length > 0 && (
                <div className="mb-4">
                  <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gold-700 mb-1.5"><ArrowRight className="w-3.5 h-3.5" /> To improve</p>
                  <ul className="space-y-1">
                    {result.improvements.map((s, i) => <li key={i} className="text-sm text-ink-900 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-gold-600"><MathText>{s}</MathText></li>)}
                  </ul>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Scored {pct}%</span>
                {index < questions.length - 1 ? (
                  <Button onClick={nextQuestion} className="rounded-xl font-black">Next question <ArrowRight className="w-4 h-4" /></Button>
                ) : (
                  <Button asChild variant="outline" className="rounded-xl font-black"><Link href="/dashboard">Back to dashboard</Link></Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Shell>
  )
}
