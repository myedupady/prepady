import Link from 'next/link'
import {
  Brain,
  Sparkles,
  Timer,
  GraduationCap,
  WifiOff,
  PenLine,
  ArrowRight,
  CheckCircle2,
  ListChecks,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SampleQuiz } from '@/components/SampleQuiz'
import { EXAMS } from '@/lib/exams'

const FEATURES = [
  { icon: Brain, title: 'Adaptive practice', desc: 'Questions adjust to your level in real time and flag the topics you keep missing.' },
  { icon: Timer, title: 'JAMB CBT simulation', desc: 'Timed, full-paper mocks in the real exam format so nothing surprises you on the day.' },
  { icon: Sparkles, title: '“Explain this to me”', desc: 'An AI tutor breaks down every question step by step — and tells you why your answer was wrong.' },
  { icon: PenLine, title: 'AI essay marking', desc: 'Submit theory answers and get instant, examiner-style marks and feedback.', soon: true },
  { icon: GraduationCap, title: 'Past questions bank', desc: 'Years of real WAEC, NECO and JAMB questions with worked explanations.' },
  { icon: WifiOff, title: 'Works offline', desc: 'Download notes and keep practising on low or no connectivity.', soon: true },
]

const STEPS = [
  { icon: Target, title: 'Pick your exam', desc: 'WAEC, NECO, JAMB, Post-UTME, IGCSE or A-Level — and the subjects you need.' },
  { icon: ListChecks, title: 'Practise adaptively', desc: 'The engine serves questions at the right level and tracks your weak topics.' },
  { icon: Sparkles, title: 'Let AI explain', desc: 'Tap “Explain this to me” on any question for a clear, step-by-step breakdown.' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-brand-950/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white font-black text-lg">
            <GraduationCap className="w-6 h-6 text-gold-400" />
            Prepady<span className="text-gold-400">.</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-7 text-sm font-semibold text-white/70">
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#try" className="hover:text-white transition-colors">Try it</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="hidden sm:block text-sm font-semibold text-white/80 hover:text-white">
              Log in
            </Link>
            <Button size="sm" variant="accent" asChild className="rounded-xl font-black">
              <Link href="/admin">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[40rem] w-[40rem] rounded-full bg-brand-500/25 blur-[130px]" />
          <div className="absolute top-32 right-0 h-80 w-80 rounded-full bg-gold-500/20 blur-[110px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-24 sm:py-28 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-gold-300 mb-6">
            <Sparkles className="w-4 h-4" /> AI-powered exam prep
          </p>
          <h1 className="text-4xl md:text-6xl font-black leading-[1.05] mb-6">
            Pass WAEC, NECO &amp; JAMB —
            <br />
            with an <span className="text-gold-400">AI tutor</span> in your pocket.
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-9">
            Adaptive practice tests, real past questions, and an AI that explains every
            single question. Built for the Nigerian curriculum (NERDC).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" variant="accent" asChild className="rounded-2xl font-black">
              <Link href="#try">Try a question now <ArrowRight className="w-5 h-5" /></Link>
            </Button>
            <Button size="xl" variant="white" asChild className="rounded-2xl font-black">
              <Link href="#pricing">See plans</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-10">
            {EXAMS.map((e) => (
              <span key={e.value} className="bg-white/10 text-white/80 text-sm font-semibold px-3 py-1.5 rounded-full">
                {e.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-black uppercase tracking-widest text-brand mb-2">How it works</p>
          <h2 className="text-3xl font-black text-gray-900">Three steps to a higher score</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {STEPS.map(({ icon: Icon, title, desc }, idx) => (
            <div key={title} className="relative rounded-3xl border border-gray-100 bg-white p-7 shadow-sm">
              <span className="absolute -top-3 -left-3 w-9 h-9 rounded-xl bg-brand text-white text-sm font-black flex items-center justify-center shadow-brand">
                {idx + 1}
              </span>
              <Icon className="w-7 h-7 text-brand mb-4" />
              <h3 className="font-black text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Try it (interactive sample) ── */}
      <section id="try" className="bg-gray-50 border-y border-gray-100 py-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-8">
            <p className="text-xs font-black uppercase tracking-widest text-gold-600 mb-2">Try it — no signup</p>
            <h2 className="text-3xl font-black text-gray-900">Answer a real question</h2>
            <p className="text-gray-500 mt-2">Pick an answer, then tap “Explain this to me” to meet your AI tutor.</p>
          </div>
          <SampleQuiz />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Everything you need to score higher</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Three pillars — adaptive testing, NERDC-aligned content, and an AI explanation layer on every question.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, soon }) => (
            <Card key={title} className="border border-gray-100 shadow-sm hover:shadow-brand transition-shadow">
              <CardContent className="p-6">
                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-black text-gray-900 mb-1 flex items-center gap-2">
                  {title}
                  {soon && (
                    <span className="text-[10px] font-black uppercase tracking-wide text-gold-700 bg-gold-50 px-2 py-0.5 rounded-full">
                      Soon
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-gray-50 border-t py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-10">Simple, student-friendly pricing</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="border border-gray-200">
              <CardContent className="p-7">
                <p className="font-black text-gray-900 text-lg">Free</p>
                <p className="text-gray-500 text-sm mb-5">Get started, no card needed.</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  {['Daily adaptive practice', '5 AI explanations per day', 'Past-question samples'].map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand" /> {t}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="relative border-2 border-brand shadow-brand">
              <span className="absolute -top-3 right-6 text-[10px] font-black uppercase tracking-widest text-white bg-gold-500 px-3 py-1 rounded-full">
                Most popular
              </span>
              <CardContent className="p-7">
                <p className="font-black text-brand-900 text-lg">Premium</p>
                <p className="text-gray-500 text-sm mb-5">For serious exam season.</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  {['Unlimited AI explanations', 'Full timed CBT mocks', 'AI essay marking', 'Full past-question bank'].map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand" /> {t}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          <p className="text-center text-gray-400 text-xs mt-6">
            Monthly, termly and JAMB-season bundles. Pricing finalised at launch.
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-gold-500/20 blur-[120px]" />
        <div className="relative max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to study smarter?</h2>
          <p className="text-white/70 mb-8">Start practising free — upgrade when exam season heats up.</p>
          <Button size="xl" variant="accent" asChild className="rounded-2xl font-black">
            <Link href="/admin">Get started <ArrowRight className="w-5 h-5" /></Link>
          </Button>
        </div>
      </section>

      <footer className="bg-brand-950 text-white/50 text-center text-sm py-8">
        © {new Date().getFullYear()} Prepady. AI-powered exam preparation.
      </footer>
    </main>
  )
}
