'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  GraduationCap, Sparkles, CheckCircle2, XCircle, ArrowRight, Loader2, RotateCcw, Lock, Clock, PlayCircle, AlarmClock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MathText } from '@/components/MathText'
import { getYouTubeId } from '@/lib/utils'

interface ClientQuestion {
  id: number | string
  questionText: string
  options: { text: string }[]
  difficulty: string | number
  points: number
  questionImageUrl?: string | null
}
interface SessionStats { questionsAnswered: number; totalQuestions: number; score: number; maxScore: number; percentage: number }
interface AnswerResult {
  isCorrect: boolean
  correctAnswer: string
  explanation: string | null
  videoUrl?: string | null
  nextQuestion: ClientQuestion | null
  isComplete: boolean
  stats: SessionStats
}
type Phase = 'loading' | 'question' | 'complete' | 'empty' | 'error'

export function QuizRunner({
  examId,
  examName,
  country,
  subjectId = null,
  topicId = null,
  label,
  mode = 'practice',
}: {
  examId: string
  examName: string
  country: string
  subjectId?: string | null
  topicId?: string | null
  label?: string
  mode?: 'practice' | 'mock'
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
  // Mock timer + video solution
  const [deadline, setDeadline] = useState<number | null>(null)
  const [remainingMs, setRemainingMs] = useState<number>(0)
  const [timedOut, setTimedOut] = useState(false)
  const [lastStats, setLastStats] = useState<SessionStats | null>(null)
  const [showVideo, setShowVideo] = useState(false)

  const start = useCallback(async () => {
    setPhase('loading')
    setTimedOut(false)
    setDeadline(null)
    try {
      const r = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ examId, subjectId, topicId, mode }),
      })
      const data = await r.json()
      if (r.status === 401) { window.location.href = `/login?redirect=/quiz/${examId}`; return }
      if (r.status === 503) { setPhase('empty'); return }
      if (!r.ok) { setErrorMsg(data.error || 'Could not start the quiz.'); setPhase('error'); return }
      setSessionId(data.sessionId)
      setQuestion(data.firstQuestion)
      setTotal(data.totalQuestions)
      setCurrent(1)
      setLastStats({ questionsAnswered: 0, totalQuestions: data.totalQuestions, score: 0, maxScore: 0, percentage: 0 })
      if (data.mode === 'mock' && data.timeLimitMinutes > 0) {
        setDeadline(Date.now() + data.timeLimitMinutes * 60000)
      }
      setPhase('question')
    } catch {
      setErrorMsg('Could not start the quiz. Please try again.')
      setPhase('error')
    }
  }, [examId, subjectId, topicId, mode])

  // Mock countdown — tick every second; complete when time runs out.
  useEffect(() => {
    if (!deadline) return
    const tick = () => {
      const ms = deadline - Date.now()
      setRemainingMs(ms)
      if (ms <= 0) {
        setTimedOut(true)
        setPhase('complete')
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [deadline])

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
      setLastStats(data.stats)
      setShowVideo(false)
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
    setShowVideo(false)
  }

  const mins = Math.max(0, Math.floor(remainingMs / 60000))
  const secs = Math.max(0, Math.floor((remainingMs % 60000) / 1000))
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`
  const lowTime = deadline && remainingMs < 60000

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
  if (phase === 'complete') {
    const s = result?.stats ?? lastStats ?? { score: 0, maxScore: 0, percentage: 0, questionsAnswered: 0, totalQuestions: total }
    return (
      <Shell>
        <div className="rounded-3xl border border-border bg-card shadow-brand p-10 text-center">
          {timedOut ? <AlarmClock className="w-9 h-9 text-destructive mx-auto mb-3" /> : <Sparkles className="w-9 h-9 text-gold-500 mx-auto mb-3" />}
          {timedOut && <p className="font-black text-destructive text-sm uppercase tracking-widest mb-2">Time&apos;s up</p>}
          <p className="font-display text-3xl font-extrabold text-ink-900">{s.percentage}%</p>
          <p className="text-muted-foreground text-sm mt-1 mb-7">
            You scored {s.score} of {s.maxScore} on {examName}{label ? ` · ${label}` : ''}.
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
        <div className="flex items-center gap-3">
          {deadline && (
            <span className={`inline-flex items-center gap-1 text-xs font-black tabular-nums px-2 py-1 rounded-lg ${lowTime ? 'bg-destructive/10 text-destructive animate-pulse' : 'bg-ink-900 text-gold-400'}`}>
              <Clock className="w-3.5 h-3.5" /> {timeStr}
            </span>
          )}
          <span className="text-xs font-semibold text-muted-foreground">{current} / {total}</span>
        </div>
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

            {result?.videoUrl && (
              <div className="mt-4">
                {!showVideo ? (
                  <Button onClick={() => setShowVideo(true)} variant="ghost" className="rounded-xl font-bold text-ink-900 hover:bg-ink-50">
                    <PlayCircle className="w-4 h-4" /> Watch video solution
                  </Button>
                ) : getYouTubeId(result.videoUrl) ? (
                  <div className="relative w-full overflow-hidden rounded-2xl border border-border" style={{ aspectRatio: '16 / 9' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeId(result.videoUrl)}`}
                      title="Video solution"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                ) : (
                  <a href={result.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-gold-700 hover:text-gold-800">
                    <PlayCircle className="w-4 h-4" /> Open video solution
                  </a>
                )}
              </div>
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
