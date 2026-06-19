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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EXAMS } from '@/lib/exams'

const FEATURES = [
  { icon: Brain, title: 'Adaptive practice', desc: 'Questions adjust to your level in real time and flag the topics you keep missing.' },
  { icon: Timer, title: 'JAMB CBT simulation', desc: 'Timed, full-paper mocks in the real exam format so nothing surprises you on the day.' },
  { icon: Sparkles, title: '“Explain this to me”', desc: 'An AI tutor breaks down every question step by step — and tells you why your answer was wrong.' },
  { icon: PenLine, title: 'AI essay marking', desc: 'Submit theory answers and get instant, examiner-style marks and feedback. (Coming soon.)' },
  { icon: GraduationCap, title: 'Past questions bank', desc: 'Years of real WAEC, NECO and JAMB questions with worked explanations.' },
  { icon: WifiOff, title: 'Works offline', desc: 'Download notes and keep practising on low or no connectivity. (Coming soon.)' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-brand-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <p className="inline-flex items-center gap-2 text-gold font-black text-xs uppercase tracking-widest mb-4">
            <Sparkles className="w-4 h-4" /> AI-powered exam prep
          </p>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
            Pass WAEC, NECO &amp; JAMB —<br />with an AI tutor in your pocket.
          </h1>
          <p className="text-white/75 text-lg max-w-2xl mx-auto mb-9">
            Adaptive practice tests, real past questions, and an AI that explains every
            single question. Built for the Nigerian curriculum (NERDC).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" variant="accent" asChild className="rounded-2xl font-black">
              <Link href="/admin">Start practising <ArrowRight className="w-5 h-5" /></Link>
            </Button>
            <Button size="xl" variant="white" asChild className="rounded-2xl font-black">
              <Link href="#pricing">See plans</Link>
            </Button>
          </div>
          {/* Exam chips */}
          <div className="flex flex-wrap gap-2 justify-center mt-10">
            {EXAMS.map((e) => (
              <span
                key={e.value}
                className="bg-white/10 text-white/80 text-sm font-semibold px-3 py-1.5 rounded-full"
              >
                {e.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-black text-center text-gray-900 mb-3">
          Everything you need to score higher
        </h2>
        <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
          Three pillars — adaptive testing, NERDC-aligned content, and an AI explanation layer on every question.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-black text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
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
            <Card className="border-2 border-brand">
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

      <footer className="bg-brand-900 text-white/60 text-center text-sm py-8">
        © {new Date().getFullYear()} Prepady. AI-powered exam preparation.
      </footer>
    </main>
  )
}
