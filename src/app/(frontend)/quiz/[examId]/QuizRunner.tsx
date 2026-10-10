'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  GraduationCap, Sparkles, CheckCircle2, XCircle, ArrowRight, Loader2, RotateCcw, Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MathText } from '@/components/MathText'

interface ClientQuestion {
  id: number | string
  questionText: string
  options: { text: string }[]
  difficulty: string | number
  points: number
  questionImageUrl?: string | null
}
interface AnswerResult {
  isCorrect: boolean
  correctAnswer: string
  explanation: string | null
  nextQuestion: ClientQuestion | null
  isComplete: boolean
  stats: { questionsAnswered: number; totalQuestions: number; score: number; maxScore: number; percentage: number }
}
type Phase = 'loading' | 'question' | 'complete' | 'empty' | 'error'

export function QuizRunner({
  examId,
  examName,
  country,
  subjectId = null,
  topicId = null,
  label,
}: {
  examId: string
  examName: string
  country: string
  subjectId?: string | null
  topicId?: string | null
  label?: string
}) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [sessionId, setSessionId] = useState<string>('')
  const [question, setQuestion] = useState<ClientQuestion | null>(null)
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [aiText, setAiText] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiLocked, setAiLocked] = useState(false)

  const start = useCallback(async () => {
    setPhase('loading')
    try {
      const r = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ examId, subjectId, topicId }),
      })
      const data = await r.json()
      if (r.status === 401) { window.location.href = `/login?redirect=/quiz/${examId}`; return }
      if (r.status === 503) { setPhase('empty'); return }
      if (!r.ok) { setErrorMsg(data.error || 'Could not start the quiz.'); setPhase('error'); return }
      setSessionId(data.sessionId)
      setQuestion(data.firstQuestion)
      setTotal(data.totalQuestions)
      setCurrent(1)
      setPhase('question')
    } catch {
      setErrorMsg('Could not start the quiz. Please try again.')
      setPhase('error')
    }
  }, [examId, subjectId, topicId])

  useEffect(() => { start() }, [start])

  async function submit() {
    if (!selected || !question || submitting) return
    setSubmitting(true)
    try {
      const r = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId, questionId: question.id, givenAnswer: selected }),
      })
      const data = (await r.json()) as AnswerResult
      if (!r.ok) { setErrorMsg('Could not submit your answer.'); setPhase('error'); return }
      setResult(data)
    } catch {
      setErrorMsg('Could not submit your answer.'); setPhase('error')
    } finally {
      setSubmitting(false)
    }
  }

  function next() {
    if (!result) return
    if (result.isComplete || !result.nextQuestion) { setPhase('complete'); return }
    setQuestion(result.nextQuestion)
    setCurrent((n) => n + 1)
    setSelected(null)
    setResult(null)
    setAiText(null)
    setAiLocked(false)
  }

  async function explain() {
    if (!question || aiLoading) return
    setAiLoading(true)
    try {
      const r = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ questionId: question.id, givenAnswer: selected }),
      })
      const data = await r.json()
      if (r.status === 403 && data.requiresUpgrade) { setAiLocked(true); return }
      if (r.ok) setAiText(data.explanation)
      else setAiText(data.error || 'Could not generate an explanation right now.')
    } catch {
      setAiText('Could not generate an explanation right now.')
    } finally {
      setAiLoading(false)
    }
  }

  // ── Shells ─────────────────────────────────────────────────────────────────
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <GraduationCap className="w-6 h-6 text-gold-500" /> Prepady<span className="text-gold-500">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href={`/theory/${examId}`} className="text-sm font-semibold text-muted-foreground hover:text-ink-900">Theory</Link>
            <Link href={`/quiz/${examId}`} className="text-sm font-semibold text-muted-foreground hover:text-ink-900">Change</Link>
          </div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-6 py-8">{children}</div>
    </main>
  )

  if (phase === 'loading') {
    return <Shell><div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div></Shell>
  }
  if (phase === 'empty') {
    return (
      <Shell>
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-display text-xl font-extrabold text-ink-900 mb-1">No questions yet{label ? ` for ${label}` : ` for ${examName}`}</p>
          <p className="text-muted-foreground text-sm mb-6">Try another subject or topic for this exam.</p>
          <Button asChild variant="accent" className="rounded-xl font-black"><Link href={`/quiz/${examId}`}>Choose another</Link></Button>
        </div>
      </Shell>
    )
  }
  if (phase === 'error') {
    return (
      <Shell>
        <div className="rounded-3xl border border-border bg-card p-10 text-center">
          <p className="font-bold text-ink-900 mb-1">Something went wrong</p>
          <p className="text-muted-foreground text-sm mb-6">{errorMsg}</p>
          <Button onClick={start} className="rounded-xl font-black"><RotateCcw className="w-4 h-4" /> Try again</Button>
        </div>
      </Shell>
    )
  }
  if (phase === 'complete' && result) {
    const pct = result.stats.percentage
    return (
      <Shell>
        <div className="rounded-3xl border border-border bg-card shadow-brand p-10 text-center">
          <Sparkles className="w-9 h-9 text-gold-500 mx-auto mb-3" />
          <p className="font-display text-3xl font-extrabold text-ink-900">{pct}%</p>
          <p className="text-muted-foreground text-sm mt-1 mb-7">
            You scored {result.stats.score} of {result.stats.maxScore} on {examName}.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={start} variant="accent" className="rounded-xl font-black"><RotateCcw className="w-4 h-4" /> Practise again</Button>
            <Button asChild variant="outline" className="rounded-xl font-black"><Link href={`/quiz/${examId}`}>Choose another</Link></Button>
          </div>
        </div>
      </Shell>
    )
  }

  // ── Question ───────────────────────────────────────────────────────────────
  if (!question) return <Shell><div /></Shell>
  const answered = !!result
  return (
    <Shell>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-black uppercase tracking-widest text-gold-700">{examName}{label ? ` · ${label}` : country ? ` · ${country}` : ''}</span>
        <span className="text-xs font-semibold text-muted-foreground">{current} / {total}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted mb-6 overflow-hidden">
        <div className="h-full bg-gold-400 transition-all" style={{ width: `${(current / Math.max(1, total)) * 100}%` }} />
      </div>

      <div className="rounded-3xl border border-border bg-card shadow-brand p-6 sm:p-8">
        <p className="text-lg font-bold text-ink-900 mb-5"><MathText>{question.questionText}</MathText></p>
        <div className="space-y-2.5">
          {question.options.map((opt, oi) => {
            const isPicked = selected === opt.text
            const isAnswer = answered && result?.correctAnswer && opt.text.trim().toLowerCase() === String(result.correctAnswer).trim().toLowerCase()
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
                onClick={() => setSelected(opt.text)}
                className={`w-full flex items-center justify-between gap-3 text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all disabled:cursor-default ${cls}`}
              >
                <span><span className="text-gray-400 mr-2">{String.fromCharCode(65 + oi)}.</span><MathText>{opt.text}</MathText></span>
                {answered && isAnswer && <CheckCircle2 className="w-5 h-5 text-success shrink-0" />}
                {answered && isPicked && !isAnswer && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
              </button>
            )
          })}
        </div>

        {!answered ? (
          <Button onClick={submit} disabled={!selected || submitting} className="w-full rounded-xl font-black h-12 mt-6">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit answer'}
          </Button>
        ) : (
          <div className="mt-6">
            <p className={`text-sm font-bold mb-3 ${result?.isCorrect ? 'text-success' : 'text-destructive'}`}>
              {result?.isCorrect ? '✓ Correct!' : <>Not quite — the answer is <MathText>{String(result?.correctAnswer ?? '')}</MathText>.</>}
            </p>

            {aiLocked ? (
              <div className="rounded-2xl border-2 border-dashed border-gold-300 bg-gold-50/60 p-4 text-center">
                <Lock className="w-6 h-6 text-gold-600 mx-auto mb-2" />
                <p className="text-sm text-ink-900 font-semibold mb-1">You’ve used your free AI explanations for today.</p>
                <p className="text-xs text-muted-foreground mb-3">Upgrade to Premium for unlimited explanations.</p>
                <Button asChild variant="accent" size="sm" className="rounded-lg font-black"><Link href="/dashboard">See plans</Link></Button>
              </div>
            ) : aiText ? (
              <div className="rounded-2xl bg-gold-50 border border-gold-200 p-4">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gold-700 mb-2"><Sparkles className="w-3.5 h-3.5" /> AI tutor</p>
                <p className="text-sm text-ink-900 leading-relaxed"><MathText>{aiText}</MathText></p>
              </div>
            ) : (
              <Button onClick={explain} variant="outline" disabled={aiLoading} className="rounded-xl font-bold w-full sm:w-auto">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Explain this to me</>}
              </Button>
            )}

            <div className="mt-5 flex justify-end">
              <Button onClick={next} className="rounded-xl font-black">
                {result?.isComplete ? 'See results' : 'Next question'} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}
