import type { Metadata } from 'next'
import { BrandLogo } from '@/components/BrandLogo'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAuthContext } from '@/lib/auth'
import { Target, Trophy, CheckCircle2, ArrowRight, Sparkles, Globe2, TrendingUp, Gauge, BarChart3, ShieldCheck, Clapperboard, Handshake, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LogoutButton } from '@/components/LogoutButton'
import { RadialProgress, BarList, TrendChart, type BarItem } from '@/components/charts/Charts'
import { ReferralCard } from '@/components/ReferralCard'
import { REFERRAL_REWARD_DAYS } from '@/lib/subscription'

export const metadata: Metadata = { title: 'Dashboard — Prepady' }
export const dynamic = 'force-dynamic'

interface AnswerLog { isCorrect?: boolean; subjectName?: string | null; topicName?: string | null }
interface Session {
  status?: string; score?: number; maxScore?: number; mode?: string; answers?: AnswerLog[]
  completedAt?: string; startedAt?: string
  subject?: { id?: number; name?: string } | number | null
}

const pctOf = (s: Session) => (s.maxScore ? Math.round((Number(s.score) / Number(s.maxScore)) * 100) : 0)
const bandTone = (pct: number): BarItem['tone'] => (pct >= 75 ? 'good' : pct >= 50 ? 'fair' : 'weak')

type Range = 'all' | 'week' | 'month' | 'year'
function rangeStart(range: Range): Date | null {
  const now = new Date()
  if (range === 'week') { const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d }
  if (range === 'month') return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  if (range === 'year') return new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
  return null
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string; subject?: string }> }) {
  const { payload, user } = await getAuthContext()
  if (!user) redirect('/login?redirect=/dashboard')
  const userId = user.id
  const sp = await searchParams
  const range: Range = sp.range === 'week' || sp.range === 'month' || sp.range === 'year' ? sp.range : 'all'
  const subjectFilter = sp.subject && /^\d+$/.test(sp.subject) ? sp.subject : null
  const since = rangeStart(range)

  const sessionsRes = await payload
    .find({ collection: 'quiz-sessions', where: { user: { equals: userId } }, sort: '-startedAt', limit: 300, depth: 1, overrideAccess: true })
    .catch(() => ({ docs: [] as Session[] }))
  const allSessions = sessionsRes.docs as Session[]

  // Subjects the student has practised (for the trend filter pills).
  const subjOptions = new Map<string, string>()
  for (const s of allSessions) {
    const subj = s.subject
    if (subj && typeof subj === 'object' && subj.id) subjOptions.set(String(subj.id), subj.name ?? `Subject ${subj.id}`)
  }

  // Apply the timeframe filter to everything shown below.
  const subjId = (s: Session) => (s.subject && typeof s.subject === 'object' ? String(s.subject.id ?? '') : s.subject != null ? String(s.subject) : '')
  const sessions = allSessions.filter((s) => {
    if (since) { const t = s.completedAt || s.startedAt; if (!t || new Date(t) < since) return false }
    return true
  })
  const completedAll = sessions.filter((s) => s.status === 'completed')
  // The trend/average also honour the subject filter (so it doesn't get long).
  const completed = subjectFilter ? completedAll.filter((s) => subjId(s) === subjectFilter) : completedAll
  const avg = completed.length ? Math.round(completed.reduce((a, s) => a + pctOf(s), 0) / completed.length) : 0
  const trend = [...completed].reverse().map(pctOf).slice(-12)

  // Per-subject + per-topic accuracy from the answer log.
  const subj = new Map<string, { c: number; t: number }>()
  const topic = new Map<string, { c: number; t: number }>()
  for (const s of sessions) {
    for (const a of s.answers ?? []) {
      if (a.subjectName) {
        const m = subj.get(a.subjectName) ?? { c: 0, t: 0 }
        m.t++
        if (a.isCorrect) m.c++
        subj.set(a.subjectName, m)
      }
      if (a.topicName) {
        const m = topic.get(a.topicName) ?? { c: 0, t: 0 }
        m.t++
        if (a.isCorrect) m.c++
        topic.set(a.topicName, m)
      }
    }
  }
  const subjectBars: BarItem[] = [...subj.entries()]
    .map(([label, m]) => ({ label, pct: (m.c / m.t) * 100, detail: `${m.t} Q${m.t === 1 ? '' : 's'}`, tone: bandTone((m.c / m.t) * 100) }))
    .sort((a, b) => b.pct - a.pct)
  const weakTopics: BarItem[] = [...topic.entries()]
    .filter(([, m]) => m.t >= 2)
    .map(([label, m]) => ({ label, pct: (m.c / m.t) * 100, detail: `${m.c}/${m.t}`, tone: bandTone((m.c / m.t) * 100) }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 5)
  const totalAnswered = [...subj.values()].reduce((a, m) => a + m.t, 0)

  const u = user as { name?: string; email?: string; plan?: string; role?: string; referralCode?: string; referralCount?: number }
  const firstName = u.name?.split(' ')[0] ?? 'there'
  const premium = u.plan === 'premium'
  const isAdmin = u.role === 'admin'
  // Is this user a B2B partner (has a linked partner profile)?
  const partnerCount = await payload
    .count({ collection: 'partners', where: { profile: { equals: userId } }, overrideAccess: true })
    .catch(() => ({ totalDocs: 0 }))
  const isPartner = (partnerCount.totalDocs ?? 0) > 0

  const stats = [
    { label: 'Quizzes completed', value: String(completedAll.length), icon: CheckCircle2 },
    { label: 'Questions answered', value: String(totalAnswered), icon: Target },
    { label: 'Plan', value: premium ? 'Premium' : 'Free', icon: Trophy },
  ]

  // Trend filter links (preserve the other param).
  const subjOpts = [...subjOptions.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  const trendQs = (over: { range?: Range; subject?: string | undefined }) => {
    const p = new URLSearchParams()
    const r = over.range ?? range
    const sj = 'subject' in over ? over.subject : subjectFilter ?? undefined
    if (r && r !== 'all') p.set('range', r)
    if (sj) p.set('subject', sj)
    const s = p.toString()
    return s ? `/dashboard?${s}` : '/dashboard'
  }
  const fpill = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-black border-2 transition-colors whitespace-nowrap ${active ? 'border-ink-900 bg-ink-900 text-gold-400' : 'border-border bg-card text-ink-900 hover:border-ink-900'}`

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <BrandLogo className="w-7 h-7" />
            Prepady<span className="text-gold-500">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/learn" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
              <Clapperboard className="w-4 h-4" /> Lessons
            </Link>
            <Link href="/leaderboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
              <Trophy className="w-4 h-4" /> Leaderboard
            </Link>
            <Link href="/billing" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
              <Receipt className="w-4 h-4" /> Billing
            </Link>
            {isPartner && (
              <Link href="/partner" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
                <Handshake className="w-4 h-4" /> Partner
              </Link>
            )}
            {isAdmin && (
              <Link href="/insights" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
                <ShieldCheck className="w-4 h-4" /> Insights
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink-900">Welcome back, {firstName}.</h1>
            <p className="text-muted-foreground text-sm mt-1">{u.email}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${premium ? 'bg-gold-100 text-gold-800' : 'bg-secondary text-secondary-foreground'}`}>
            <Sparkles className="w-3.5 h-3.5" /> {premium ? 'Premium' : 'Free plan'}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border border-border bg-card shadow-brand">
              <CardContent className="p-5">
                <div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center mb-3"><Icon className="w-4 h-4 text-gold-600" /></div>
                <p className="text-2xl font-black text-ink-900">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upgrade CTA (free users) */}
        {!premium && (
          <Link href="/upgrade" className="block mb-8 rounded-2xl bg-ink-900 text-ink-50 p-5 hover:bg-ink-800 transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-black flex items-center gap-2"><Sparkles className="w-4 h-4 text-gold-400" /> Go Premium</p>
                <p className="text-sm text-ink-300 mt-0.5">Unlimited AI help, essay marking, timed mocks & the full past-question bank.</p>
              </div>
              <span className="text-sm font-black text-gold-400 shrink-0 whitespace-nowrap">Upgrade →</span>
            </div>
          </Link>
        )}

        {/* Progress filters */}
        <div className="mb-4 space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', 'week', 'month', 'year'] as const).map((r) => (
              <Link key={r} href={trendQs({ range: r })} className={fpill(range === r)}>
                {r === 'all' ? 'All time' : r === 'week' ? 'This week' : r === 'month' ? 'This month' : 'This year'}
              </Link>
            ))}
          </div>
          {subjOpts.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Link href={trendQs({ subject: undefined })} className={fpill(!subjectFilter)}>All subjects</Link>
              {subjOpts.map(([id, name]) => (
                <Link key={id} href={trendQs({ subject: id })} className={fpill(subjectFilter === id)}>{name}</Link>
              ))}
            </div>
          )}
        </div>

        {/* Charts row */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="border border-border bg-card shadow-brand">
            <CardContent className="p-5 flex flex-col items-center">
              <p className="self-start flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground mb-3"><Gauge className="w-3.5 h-3.5" /> Average score</p>
              <RadialProgress value={avg} sublabel="avg" tone={avg >= 75 ? 'success' : 'gold'} />
            </CardContent>
          </Card>
          <Card className="border border-border bg-card shadow-brand md:col-span-2">
            <CardContent className="p-5">
              <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground mb-3"><TrendingUp className="w-3.5 h-3.5" /> Score trend</p>
              <TrendChart data={trend} />
            </CardContent>
          </Card>
        </div>

        {/* Gap detection */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="border border-border bg-card shadow-brand">
            <CardContent className="p-5">
              <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground mb-4"><BarChart3 className="w-3.5 h-3.5" /> Performance by subject</p>
              <BarList items={subjectBars} />
            </CardContent>
          </Card>
          <Card className="border border-border bg-card shadow-brand">
            <CardContent className="p-5">
              <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground mb-4"><Target className="w-3.5 h-3.5" /> Focus areas (weakest topics)</p>
              <BarList items={weakTopics} />
            </CardContent>
          </Card>
        </div>

        {/* Referral */}
        {u.referralCode && (
          <div className="mb-8">
            <ReferralCard code={u.referralCode} count={u.referralCount ?? 0} rewardDays={REFERRAL_REWARD_DAYS} />
          </div>
        )}

        {/* Start practising */}
        <Card className="border border-border bg-card shadow-brand mb-8">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-black text-ink-900 mb-1">Ready to practise?</h2>
              <p className="text-sm text-muted-foreground">Pick an exam, choose a subject or topic, and go — with an AI tutor on every question.</p>
            </div>
            <Button asChild variant="accent" className="rounded-xl font-black shrink-0"><Link href="/quiz">Browse exams <ArrowRight className="w-4 h-4" /></Link></Button>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <h2 className="font-display text-lg font-extrabold text-ink-900 mb-4">Recent activity</h2>
        {completed.length === 0 ? (
          <Card className="border border-dashed border-border bg-card">
            <CardContent className="py-12 text-center">
              <Globe2 className="w-9 h-9 text-gold-400 mx-auto mb-3" />
              <p className="font-bold text-ink-900 mb-1">No quizzes yet</p>
              <p className="text-sm text-muted-foreground mb-5">Your results, progress, and focus areas will appear here.</p>
              <Button asChild className="rounded-xl font-black"><Link href="/quiz"><Globe2 className="w-4 h-4" /> Explore exams</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-border bg-card">
            <CardContent className="p-5 text-sm text-muted-foreground">
              {completed.length} completed quiz{completed.length === 1 ? '' : 'zes'} · average {avg}% · {totalAnswered} questions answered
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
