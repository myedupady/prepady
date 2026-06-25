import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import {
  Brain, Sparkles, Timer, GraduationCap, WifiOff, PenLine,
  ArrowRight, CheckCircle2, ListChecks, Target, Globe2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SampleQuiz } from '@/components/SampleQuiz'
import { EXAMS, examsByRegion } from '@/lib/exams'
import { hexToRgba } from '@/lib/color'

export const dynamic = 'force-dynamic'

const FEATURES = [
  { icon: Brain, title: 'Adaptive practice', desc: 'Questions adjust to your level in real time and flag the topics you keep missing.' },
  { icon: Timer, title: 'Timed exam simulation', desc: 'Full-paper mocks in the real CBT format so nothing surprises you on the day.' },
  { icon: Sparkles, title: '“Explain this to me”', desc: 'An AI tutor breaks down every question step by step — and tells you why your answer was wrong.' },
  { icon: PenLine, title: 'AI essay marking', desc: 'Submit theory answers and get instant, examiner-style marks and feedback.', soon: true },
  { icon: GraduationCap, title: 'Past questions bank', desc: 'Years of real past questions for your exam, with worked explanations.' },
  { icon: WifiOff, title: 'Works offline', desc: 'Download notes and keep practising on low or no connectivity.', soon: true },
]

const STEPS = [
  { icon: Target, title: 'Pick your exam', desc: 'From WAEC to KCSE to the Baccalauréat — choose your national exam and subjects.' },
  { icon: ListChecks, title: 'Practise adaptively', desc: 'The engine serves questions at the right level and tracks your weak topics.' },
  { icon: Sparkles, title: 'Let AI explain', desc: 'Tap “Explain this to me” on any question for a clear, step-by-step breakdown.' },
]

interface RegionView {
  label: string
  color: string
  exams: { code: string }[]
}

/** Load the exam catalogue from the DB; fall back to the static list if unavailable/empty. */
async function loadCatalogue(): Promise<{ regions: RegionView[]; examCount: number; countryCount: number }> {
  try {
    const payload = await getPayload({ config: configPromise })
    const [regionsRes, examsRes] = await Promise.all([
      payload.find({ collection: 'regions', sort: 'order', limit: 100, depth: 0 }),
      payload.find({ collection: 'exams', where: { status: { equals: 'active' } }, sort: 'order', limit: 1000, depth: 1 }),
    ])
    if (regionsRes.docs.length === 0) throw new Error('empty')
    const exams = examsRes.docs as Array<{ code: string; country: string; region: { id: number } | number }>
    const regions: RegionView[] = regionsRes.docs.map((r) => {
      const region = r as { id: number; name: string; color: string }
      return {
        label: region.name,
        color: region.color,
        exams: exams
          .filter((e) => (typeof e.region === 'object' ? e.region?.id : e.region) === region.id)
          .map((e) => ({ code: e.code })),
      }
    })
    return { regions, examCount: exams.length, countryCount: new Set(exams.map((e) => e.country)).size }
  } catch {
    const grouped = examsByRegion()
    return {
      regions: grouped.map((g) => ({ label: g.region.label, color: g.region.color, exams: g.exams.map((e) => ({ code: e.label })) })),
      examCount: EXAMS.length,
      countryCount: new Set(EXAMS.map((e) => e.country)).size,
    }
  }
}

const chip = (color: string) => ({ backgroundColor: hexToRgba(color, 0.13), color })

export default async function HomePage() {
  const { regions, examCount, countryCount } = await loadCatalogue()

  return (
    <main className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <GraduationCap className="w-6 h-6 text-gold-500" />
            Prepady<span className="text-gold-500">.</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-7 text-sm font-semibold text-muted-foreground">
            <a href="#exams" className="hover:text-ink-900 transition-colors">Exams</a>
            <a href="#how" className="hover:text-ink-900 transition-colors">How it works</a>
            <a href="#try" className="hover:text-ink-900 transition-colors">Try it</a>
            <a href="#pricing" className="hover:text-ink-900 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="hidden sm:block text-sm font-semibold text-muted-foreground hover:text-ink-900">
              Log in
            </Link>
            <Button size="sm" variant="accent" asChild className="rounded-xl font-black">
              <Link href="/admin">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 py-20 sm:py-24 text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-gold-700 mb-4">AI-powered exam prep</p>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-[1.05] text-ink-900 mb-6">
            One student,
            <br />
            <span className="text-gold-500">every exam in Africa.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Adaptive practice, real past questions, and an AI tutor that explains every answer —
            for {examCount} national exams across {countryCount}+ countries.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" variant="accent" asChild className="rounded-2xl font-black">
              <Link href="#try">Try a question now <ArrowRight className="w-5 h-5" /></Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="rounded-2xl font-black">
              <Link href="#exams">Find your exam</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-10">
            {regions.map((r) => (
              <span key={r.label} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full" style={chip(r.color)}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                {r.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Exams across Africa ── */}
      <section id="exams" className="bg-card border-y border-border py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gold-700 mb-2">
              <Globe2 className="w-4 h-4" /> Built for the whole continent
            </p>
            <h2 className="font-display text-3xl font-extrabold text-ink-900">{examCount} exams · {countryCount}+ countries · {regions.length} regions</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">From WAEC and JAMB to KCSE, Matric, ZIMSEC and the Baccalauréat — find your exam.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((region) => (
              <div key={region.label} className="rounded-2xl border border-border bg-background p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-2 font-black text-ink-900">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: region.color }} />
                    {region.label}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">{region.exams.length} exams</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {region.exams.slice(0, 6).map((e) => (
                    <span key={e.code} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={chip(region.color)}>
                      {e.code}
                    </span>
                  ))}
                  {region.exams.length > 6 && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      +{region.exams.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-black uppercase tracking-widest text-gold-700 mb-2">How it works</p>
          <h2 className="font-display text-3xl font-extrabold text-ink-900">Three steps to a higher score</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {STEPS.map(({ icon: Icon, title, desc }, idx) => (
            <div key={title} className="relative rounded-2xl border border-border bg-card p-7 shadow-brand">
              <span className="absolute -top-3 -left-3 w-9 h-9 rounded-xl bg-ink-900 text-primary-foreground text-sm font-black flex items-center justify-center">
                {idx + 1}
              </span>
              <Icon className="w-7 h-7 text-gold-600 mb-4" />
              <h3 className="font-black text-ink-900 mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Try it ── */}
      <section id="try" className="bg-card border-y border-border py-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-8">
            <p className="text-xs font-black uppercase tracking-widest text-gold-700 mb-2">Try it — no signup</p>
            <h2 className="font-display text-3xl font-extrabold text-ink-900">Answer a real question</h2>
            <p className="text-muted-foreground mt-2">Pick an answer, then tap “Explain this to me” to meet your AI tutor.</p>
          </div>
          <SampleQuiz />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-extrabold text-ink-900 mb-3">Everything you need to score higher</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Adaptive testing, real past questions, and an AI explanation layer on every question.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, soon }) => (
            <Card key={title} className="border border-border bg-card shadow-brand">
              <CardContent className="p-6">
                <div className="w-11 h-11 rounded-xl bg-gold-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-gold-600" />
                </div>
                <h3 className="font-black text-ink-900 mb-1 flex items-center gap-2">
                  {title}
                  {soon && (
                    <span className="text-[10px] font-black uppercase tracking-wide text-gold-800 bg-gold-100 px-2 py-0.5 rounded-full">Soon</span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-card border-t border-border py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-3xl font-extrabold text-center text-ink-900 mb-10">Simple, student-friendly pricing</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="border border-border bg-background">
              <CardContent className="p-7">
                <p className="font-black text-ink-900 text-lg">Free</p>
                <p className="text-muted-foreground text-sm mb-5">Get started, no card needed.</p>
                <ul className="space-y-2 text-sm text-ink-700">
                  {['Daily adaptive practice', '5 AI explanations per day', 'Past-question samples'].map((t) => (
                    <li key={t} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gold-600" /> {t}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="relative border-2 border-gold-400 bg-background shadow-brand">
              <span className="absolute -top-3 right-6 text-[10px] font-black uppercase tracking-widest text-ink-950 bg-gold-400 px-3 py-1 rounded-full">Most popular</span>
              <CardContent className="p-7">
                <p className="font-black text-ink-900 text-lg">Premium</p>
                <p className="text-muted-foreground text-sm mb-5">For serious exam season.</p>
                <ul className="space-y-2 text-sm text-ink-700">
                  {['Unlimited AI explanations', 'Full timed CBT mocks', 'AI essay marking', 'Full past-question bank'].map((t) => (
                    <li key={t} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gold-600" /> {t}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          <p className="text-center text-muted-foreground text-xs mt-6">Monthly, termly and exam-season bundles, priced for each market.</p>
        </div>
      </section>

      {/* ── Final CTA (gold band) ── */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gold-400 px-8 py-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-ink-950 mb-3">Ready to study smarter?</h2>
          <p className="text-ink-900/80 mb-8 max-w-xl mx-auto">Start practising free — upgrade when exam season heats up.</p>
          <Button size="xl" variant="default" asChild className="rounded-2xl font-black">
            <Link href="/admin">Get started <ArrowRight className="w-5 h-5" /></Link>
          </Button>
        </div>
      </section>

      <footer className="bg-ink-950 text-ink-300 text-center text-sm py-8">
        © {new Date().getFullYear()} Prepady. AI-powered exam preparation across Africa.
      </footer>
    </main>
  )
}
