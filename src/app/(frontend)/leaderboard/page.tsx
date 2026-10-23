import type { Metadata } from 'next'
import { BrandLogo } from '@/components/BrandLogo'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Medal, Flame } from 'lucide-react'
import { getAuthContext } from '@/lib/auth'

export const metadata: Metadata = { title: 'Leaderboard — Prepady' }
export const dynamic = 'force-dynamic'

/** Monday 00:00 UTC of the current week. */
function startOfWeekUTC(now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const diff = (d.getUTCDay() + 6) % 7 // days since Monday
  d.setUTCDate(d.getUTCDate() - diff)
  return d
}

/** First name + last initial, so the board doesn't expose full names/emails. */
function displayName(full: string): string {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}

interface Row { userId: string; name: string; points: number; maxPoints: number; quizzes: number; accuracy: number }

export default async function LeaderboardPage() {
  const { payload, user } = await getAuthContext()
  if (!user) redirect('/login?redirect=/leaderboard')

  const weekStart = startOfWeekUTC()

  const sessionsRes = await payload
    .find({
      collection: 'quiz-sessions',
      where: { and: [{ status: { equals: 'completed' } }, { completedAt: { greater_than_equal: weekStart.toISOString() } }] },
      limit: 5000,
      depth: 0,
      overrideAccess: true,
    })
    .catch(() => ({ docs: [] as Array<Record<string, unknown>> }))

  // Aggregate per user for the week.
  const agg = new Map<string, { points: number; maxPoints: number; quizzes: number }>()
  for (const s of sessionsRes.docs) {
    const uid = String((s.user as { id?: unknown })?.id ?? s.user ?? '')
    if (!uid) continue
    const m = agg.get(uid) ?? { points: 0, maxPoints: 0, quizzes: 0 }
    m.points += Number(s.score) || 0
    m.maxPoints += Number(s.maxScore) || 0
    m.quizzes += 1
    agg.set(uid, m)
  }

  // Resolve names.
  const ids = [...agg.keys()]
  const names = new Map<string, string>()
  if (ids.length) {
    const usersRes = await payload
      .find({ collection: 'users', where: { id: { in: ids } }, limit: ids.length, depth: 0, overrideAccess: true })
      .catch(() => ({ docs: [] as Array<Record<string, unknown>> }))
    for (const u of usersRes.docs) names.set(String(u.id), String(u.name ?? 'Student'))
  }

  const rows: Row[] = ids
    .map((uid) => {
      const m = agg.get(uid)!
      return { userId: uid, name: names.get(uid) ?? 'Student', points: m.points, maxPoints: m.maxPoints, quizzes: m.quizzes, accuracy: m.maxPoints ? Math.round((m.points / m.maxPoints) * 100) : 0 }
    })
    .sort((a, b) => b.points - a.points || b.accuracy - a.accuracy || b.quizzes - a.quizzes)

  const myId = String(user.id)
  const myRank = rows.findIndex((r) => r.userId === myId) // -1 if no completed quiz this week
  const top = rows.slice(0, 50)
  const myRow = myRank >= 0 ? rows[myRank] : null
  const myInTop = myRank >= 0 && myRank < top.length

  const weekLabel = weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
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
          <Flame className="w-4 h-4" /> This week · since {weekLabel}
        </p>
        <h1 className="font-display text-3xl font-extrabold text-ink-900 mb-1">Weekly leaderboard</h1>
        <p className="text-muted-foreground mb-8">Points earned in quizzes this week. Resets every Monday — climb the board!</p>

        {/* Your standing */}
        <div className="rounded-2xl bg-ink-900 text-ink-50 p-5 mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ink-800 flex items-center justify-center shrink-0"><Trophy className="w-5 h-5 text-gold-400" /></div>
            <div>
              <p className="font-black">
                {myRow ? `You're #${myRank + 1} of ${rows.length}` : 'Not ranked yet this week'}
              </p>
              <p className="text-sm text-ink-300">
                {myRow ? `${myRow.points} points · ${myRow.accuracy}% accuracy` : 'Finish a quiz this week to join the board.'}
              </p>
            </div>
          </div>
          <Link href="/quiz" className="text-sm font-black text-gold-400 shrink-0 whitespace-nowrap">Practise →</Link>
        </div>

        {top.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <Trophy className="w-9 h-9 text-gold-400 mx-auto mb-3" />
            <p className="font-display text-xl font-extrabold text-ink-900 mb-1">No scores yet this week</p>
            <p className="text-muted-foreground text-sm">Be the first — finish a quiz and claim the top spot.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {top.map((r, i) => (
              <RankRow key={r.userId} r={r} i={i} me={r.userId === myId} />
            ))}
            {/* If the viewer is outside the top list, show their row separately. */}
            {myRow && !myInTop && (
              <>
                <p className="text-center text-xs text-muted-foreground py-1">· · ·</p>
                <RankRow r={myRow} i={myRank} me />
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
