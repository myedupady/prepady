'use client'

import { useState } from 'react'
import { Sparkles, CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Self-contained, no-backend demo of the core Prepady loop:
 * answer a question → see if you're right → tap "Explain this to me" for the
 * AI tutor's worked explanation. Lets you pitch the product with zero setup
 * (no DB, no API key). Sample content mirrors what the live Claude-powered
 * /api/ai/explain endpoint produces.
 */

interface SampleQuestion {
  exam: string
  subject: string
  question: string
  options: string[]
  answer: string
  explanation: string
}

const QUESTIONS: SampleQuestion[] = [
  {
    exam: 'JAMB',
    subject: 'Mathematics',
    question: 'If 2x + 3 = 11, find the value of x.',
    options: ['3', '4', '5', '7'],
    answer: '4',
    explanation:
      'Start by isolating x.\n1. 2x + 3 = 11\n2. Subtract 3 from both sides: 2x = 8\n3. Divide both sides by 2: x = 4\nSo x = 4. If you picked 7, you likely added instead of subtracting the 3.',
  },
  {
    exam: 'WAEC',
    subject: 'English',
    question: "Choose the word nearest in meaning to 'arduous'.",
    options: ['Easy', 'Difficult', 'Pleasant', 'Brief'],
    answer: 'Difficult',
    explanation:
      "'Arduous' describes something that needs a lot of hard, sustained effort — e.g. an arduous climb. So the closest meaning is 'Difficult'. 'Easy' and 'Pleasant' are opposites, and 'Brief' is about length of time, not effort.",
  },
  {
    exam: 'NECO',
    subject: 'Biology',
    question: 'Which organelle is the powerhouse of the cell?',
    options: ['Nucleus', 'Ribosome', 'Mitochondrion', 'Chloroplast'],
    answer: 'Mitochondrion',
    explanation:
      'The mitochondrion releases energy (as ATP) through respiration, so it is called the powerhouse of the cell. The nucleus stores DNA, ribosomes build proteins, and chloroplasts (in plants) handle photosynthesis — not energy release from food.',
  },
]

export function SampleQuiz() {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [showExplain, setShowExplain] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const q = QUESTIONS[i]!
  const answered = picked !== null
  const correct = picked === q.answer

  function choose(opt: string) {
    if (answered) return
    setPicked(opt)
    if (opt === q.answer) setScore((s) => s + 1)
  }

  function next() {
    if (i + 1 >= QUESTIONS.length) {
      setDone(true)
      return
    }
    setI((n) => n + 1)
    setPicked(null)
    setShowExplain(false)
  }

  function restart() {
    setI(0)
    setPicked(null)
    setShowExplain(false)
    setScore(0)
    setDone(false)
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white shadow-brand p-8 text-center">
        <Sparkles className="w-8 h-8 text-gold-500 mx-auto mb-3" />
        <p className="text-2xl font-black text-gray-900">You scored {score}/{QUESTIONS.length}</p>
        <p className="text-gray-500 text-sm mt-1 mb-6">
          On the full app, questions adapt to your level and every answer gets an AI explanation.
        </p>
        <button
          onClick={restart}
          className="inline-flex items-center gap-2 text-brand font-semibold text-sm hover:text-brand-700"
        >
          <RotateCcw className="w-4 h-4" /> Try again
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-gray-100 bg-white shadow-brand p-6 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand">
          <span className="rounded-full bg-brand-50 px-2.5 py-1">{q.exam}</span>
          <span className="text-gray-400">{q.subject}</span>
        </span>
        <span className="text-xs font-semibold text-gray-400">
          {i + 1} / {QUESTIONS.length}
        </span>
      </div>

      <p className="text-lg font-bold text-gray-900 mb-4">{q.question}</p>

      <div className="space-y-2.5">
        {q.options.map((opt, oi) => {
          const isPicked = picked === opt
          const isAnswer = opt === q.answer
          let cls = 'border-gray-200 hover:border-brand hover:bg-brand-50/40 text-gray-700'
          if (answered) {
            if (isAnswer) cls = 'border-success bg-success/10 text-gray-900'
            else if (isPicked) cls = 'border-destructive bg-destructive/10 text-gray-900'
            else cls = 'border-gray-200 text-gray-400'
          }
          return (
            <button
              key={oi}
              type="button"
              disabled={answered}
              onClick={() => choose(opt)}
              className={`w-full flex items-center justify-between gap-3 text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all disabled:cursor-default ${cls}`}
            >
              <span>
                <span className="text-gray-400 mr-2">{String.fromCharCode(65 + oi)}.</span>
                {opt}
              </span>
              {answered && isAnswer && <CheckCircle2 className="w-5 h-5 text-success shrink-0" />}
              {answered && isPicked && !isAnswer && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
            </button>
          )
        })}
      </div>

      {answered && (
        <div className="mt-5">
          <p className={`text-sm font-bold mb-3 ${correct ? 'text-success' : 'text-destructive'}`}>
            {correct ? '✓ Correct!' : `Not quite — the answer is ${q.answer}.`}
          </p>

          {!showExplain ? (
            <Button
              onClick={() => setShowExplain(true)}
              variant="outline"
              className="rounded-xl font-bold w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4" /> Explain this to me
            </Button>
          ) : (
            <div className="rounded-2xl bg-brand-50/70 border border-brand-100 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand mb-2">
                <Sparkles className="w-3.5 h-3.5" /> AI tutor
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{q.explanation}</p>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <Button onClick={next} className="rounded-xl font-black">
              {i + 1 >= QUESTIONS.length ? 'See score' : 'Next question'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
