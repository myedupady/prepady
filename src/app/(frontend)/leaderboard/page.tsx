import type { Metadata } from 'next'
import { BrandLogo } from '@/components/BrandLogo'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Where } from 'payload'
import { ArrowLeft, ArrowRight, Trophy, Medal, Flame } from 'lucide-react'
import { getAuthContext } from '@/lib/auth'

export const metadata: Metadata = { title: 'Leaderboard — Prepady' }
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20
type Range = 'week' | 'month' | 'all'

/** Monday 00:00 UTC of the current week. */
function startOfWeekUTC(now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d
}
function rangeStart(range: Range): Date | null {
  const now = new Date()
  if (range === 'week') return startOfWeekUTC(now)
  if (range === 'month') return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  return null // all-time
}

/** First name + last initial, so the board doesn't expose full names/emails. */
function displayName(full: string): string {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}

interface Row { userId: string; name: string; points: number; maxPoints: number; quizzes: number; accuracy: number }

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; exam?: string; page?: string }>
}) {
  const { payload, user } = await getAuthContext()
  if (!user) redirect('/login?redirect=/leaderboard')
  const sp = await searchParams
  const range: Range = sp.range === 'month' || sp.range === 'all' ? sp.range : 'week'
  const examFilter = sp.exam && /^\d+$/.test(sp.exam) ? sp.exam : null
  const page = Math.max(1, Number(sp.page) || 1)

  const since = rangeStart(range)
  const where: Where = {
    and: [
      { status: { equals: 'completed' } },
      ...(since ? [{ completedAt: { greater_than_equal: since.toISOString() } } as Where] : []),
      ...(examFilter ? [{ exam: { equals: examFilter } } as Where] : []),
    ],
  }

  const sessionsRes = await payload
    .find({ collection: 'quiz-sessions', where, limit: 20000, depth: 0, overrideAccess: true })
    .catch(() => ({ docs: [] as Array<Record<string, unknown>> }))

  // Aggregate per user + collect which exams have data (for the exam filter).
  const agg = new Map<string, { points: number; maxPoints: number; quizzes: number }>()
  const examIds = new Set<string>()
  for (const s of sessionsRes.docs) {
    const uid = String((s.user as { id?: unknown })?.id ?? s.user ?? '')
    if (s.exam != null) examIds.add(String(s.exam))
    if (!uid) continue
    const m = agg.get(uid) ?? { points: 0, maxPoints: 0, quizzes: 0 }
    m.points += Number(s.score) || 0
    m.maxPoints += Number(s.maxScore) || 0
    m.quizzes += 1
    agg.set(uid, m)
  }

  // Resolve user names + exam codes (for filter pills).
  const ids = [...agg.keys()]
  const names = new Map<string, string>()
  if (ids.length) {
    const usersRes = await payload
      .find({ collection: 'users', where: { id: { in: ids } }, limit: ids.length, depth: 0, overrideAccess: true })
      .catch(() => ({ docs: [] as Array<Record<string, unknown>> }))
    for (const u of usersRes.docs) names.set(String(u.id), String(u.name ?? 'Student'))
  }
  // Exam pills: include the active filter even if it has no rows after filtering.
  const examPillIds = new Set(examIds)
  if (examFilter) examPillIds.add(examFilter)
  const exams = new Map<string, string>()
  if (examPillIds.size) {
    const exRes = await payload
      .find({ collection: 'exams', where: { id: { in: [...examPillIds] } }, limit: 200, depth: 0, overrideAccess: true })
      .catch(() => ({ docs: [] as Array<Record<string, unknown>> }))
    for (const ex of exRes.docs) exams.set(String(ex.id), String((ex as { code?: string }).code ?? `Exam ${ex.id}`))
  }

  const rows: Row[] = ids
    .map((uid) => {
      const m = agg.get(uid)!
      return { userId: uid, name: names.get(uid) ?? 'Student', points: m.points, maxPoints: m.maxPoints, quizzes: m.quizzes, accuracy: m.maxPoints ? Math.round((m.points / m.maxPoints) * 100) : 0 }
    })
    .sort((a, b) => b.points - a.points || b.accuracy - a.accuracy || b.quizzes - a.quizzes)

  const myId = String(user.id)
  const myRank = rows.findIndex((r) => r.userId === myId)
  const myRow = myRank >= 0 ? rows[myRank] : null
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const myOnPage = myRank >= 0 && myRank >= (page - 1) * PAGE_SIZE && myRank < page * PAGE_SIZE

  const qs = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams()
    const merged = { range, exam: examFilter ?? undefined, page, ...over }
    if (merged.range && merged.range !== 'week') p.set('range', String(merged.range))
    if (merged.exam) p.set('exam', String(merged.exam))
    if (merged.page && Number(merged.page) > 1) p.set('page', String(merged.page))
    const s = p.toString()
    return s ? `/leaderboard?${s}` : '/leaderboard'
  }

  const rangeLabel = range === 'week' ? 'This week' : range === 'month' ? 'This month' : 'All time'
  const medal = (i: number) => (i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : '')

  const RankRow = ({ r, i, me }: { r: Row; i: number; me: boolean }) => (
    <div className={`flex items-center gap-4 px-4 py-3 rounded-xl ${me ? 'bg-gold-50 border border-gold-300' : 'bg-card border border-border'}`}>
      <div className={`w-8 shrink-0 text-center font-black ${medal(i)}`}>
        {i < 3 ? <Medal className={`w-5 h-5 mx-auto ${medal(i)}`} /> : <span className="text-muted-foreground">{i + 1}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-ink-900 truncate">{displayName(r.name)}{me ? ' (you)' : ''}</p>
        <p className="text-xs text-muted-foreground">{r.quizzes} quiz{r.quizzes === 1 ? '' : 'zes'} · {r.accuracy}% accuracy</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-black text-ink-900">{r.points}</p>
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest">points</p>
      </div>
    </div>
  )

  const pill = (active: boolean) =>
    `px-3.5 py-1.5 rounded-xl text-sm font-black border-2 transition-colors whitespace-nowrap ${active ? 'border-ink-900 bg-ink-900 text-gold-400' : 'border-border bg-card text-ink-900 hover:border-ink-900'}`

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <BrandLogo className="w-7 h-7" /> Prepady<span className="text-gold-500">.</span>
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gold-700 mb-1">
          <Flame className="w-4 h-4" /> {rangeLabel}{examFilter ? ` · ${exams.get(examFilter) ?? 'Exam'}` : ''}
        </p>
        <h1 className="font-display text-3xl font-extrabold text-ink-900 mb-1">Leaderboard</h1>
        <p className="text-muted-foreground mb-6">Points earned in quizzes. The weekly board resets every Monday — climb it!</p>

        {/* Timeframe filter */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          <Link href={qs({ range: 'week', page: 1 })} className={pill(range === 'week')}>This week</Link>
          <Link href={qs({ range: 'month', page: 1 })} className={pill(range === 'month')}>This month</Link>
          <Link href={qs({ range: 'all', page: 1 })} className={pill(range === 'all')}>All time</Link>
        </div>

        {/* Exam filter */}
        {exams.size > 0 && (
          <div className="flex gap-2 mb-7 overflow-x-auto pb-1">
            <Link href={qs({ exam: undefined, page: 1 })} className={pill(!examFilter)}>All exams</Link>
            {[...exams.entries()].map(([id, code]) => (
              <Link key={id} href={qs({ exam: id, page: 1 })} className={pill(examFilter === id)}>{code}</Link>
            ))}
          </div>
        )}

        {/* Your standing */}
        <div className="rounded-2xl bg-ink-900 text-ink-50 p-5 mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ink-800 flex items-center justify-center shrink-0"><Trophy className="w-5 h-5 text-gold-400" /></div>
            <div>
              <p className="font-black">{myRow ? `You're #${myRank + 1} of ${rows.length}` : 'Not ranked here yet'}</p>
              <p className="text-sm text-ink-300">{myRow ? `${myRow.points} points · ${myRow.accuracy}% accuracy` : 'Finish a quiz in this filter to join the board.'}</p>
            </div>
          </div>
          <Link href="/quiz" className="text-sm font-black text-gold-400 shrink-0 whitespace-nowrap">Practise →</Link>
        </div>

        {pageRows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <Trophy className="w-9 h-9 text-gold-400 mx-auto mb-3" />
            <p className="font-display text-xl font-extrabold text-ink-900 mb-1">No scores here yet</p>
            <p className="text-muted-foreground text-sm">Try another timeframe or exam — or be the first to post a score.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2.5">
              {pageRows.map((r, i) => (
                <RankRow key={r.userId} r={r} i={(page - 1) * PAGE_SIZE + i} me={r.userId === myId} />
              ))}
              {myRow && !myOnPage && (
                <>
                  <p className="text-center text-xs text-muted-foreground py-1">· · ·</p>
                  <RankRow r={myRow} i={myRank} me />
                </>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8">
                {page > 1 ? (
                  <Link href={qs({ page: page - 1 })} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-900 hover:text-gold-700"><ArrowLeft className="w-4 h-4" /> Prev</Link>
                ) : <span />}
                <span className="text-sm text-muted-foreground font-semibold">Page {page} of {totalPages}</span>
                {page < totalPages ? (
                  <Link href={qs({ page: page + 1 })} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-900 hover:text-gold-700">Next <ArrowRight className="w-4 h-4" /></Link>
                ) : <span />}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
