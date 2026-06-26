import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import {
  GraduationCap, Zap, Target, Trophy, CheckCircle2, ArrowRight, Sparkles, Globe2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LogoutButton } from '@/components/LogoutButton'

export const metadata: Metadata = { title: 'Dashboard — Prepady' }
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  if (!token) redirect('/login?redirect=/dashboard')

  let userId: number | null = null
  try {
    const b64 = token.split('.')[1]
    const decoded = JSON.parse(Buffer.from(b64!, 'base64url').toString()) as { id?: number; exp?: number }
    if (decoded.id && (!decoded.exp || decoded.exp > Date.now() / 1000)) userId = decoded.id
  } catch {
    /* malformed token */
  }
  if (!userId) redirect('/login?redirect=/dashboard')

  const payload = await getPayload({ config: configPromise })
  const user = await payload
    .findByID({ collection: 'users', id: userId, overrideAccess: true })
    .catch(() => null)
  if (!user) redirect('/login?redirect=/dashboard')

  const sessionsRes = await payload
    .find({ collection: 'quiz-sessions', where: { user: { equals: userId } }, sort: '-startedAt', limit: 10, depth: 0 })
    .catch(() => ({ docs: [] as Array<{ status?: string; score?: number; maxScore?: number }> }))
  const sessions = sessionsRes.docs as Array<{ status?: string; score?: number; maxScore?: number }>
  const completed = sessions.filter((s) => s.status === 'completed')
  const avg = completed.length
    ? Math.round(
        completed.reduce((a, s) => a + (s.maxScore ? (Number(s.score) / Number(s.maxScore)) * 100 : 0), 0) /
          completed.length,
      )
    : 0

  const u = user as { name?: string; email?: string; plan?: string }
  const firstName = u.name?.split(' ')[0] ?? 'there'
  const premium = u.plan === 'premium'

  const stats = [
    { label: 'Quizzes completed', value: String(completed.length), icon: CheckCircle2 },
    { label: 'Average score', value: completed.length ? `${avg}%` : '—', icon: Target },
    { label: 'Plan', value: premium ? 'Premium' : 'Free', icon: Trophy },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <GraduationCap className="w-6 h-6 text-gold-500" />
            Prepady<span className="text-gold-500">.</span>
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink-900">Welcome back, {firstName}.</h1>
            <p className="text-muted-foreground text-sm mt-1">{u.email}</p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
              premium ? 'bg-gold-100 text-gold-800' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> {premium ? 'Premium' : 'Free plan'}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border border-border bg-card shadow-brand">
              <CardContent className="p-5">
                <div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-gold-600" />
                </div>
                <p className="text-2xl font-black text-ink-900">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Start practising */}
        <Card className="border border-border bg-card shadow-brand mb-8">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-black text-ink-900 mb-1">Ready to practise?</h2>
              <p className="text-sm text-muted-foreground">
                Pick an exam and start an adaptive session — with an AI tutor on every question.
              </p>
            </div>
            <Button asChild variant="accent" className="rounded-xl font-black shrink-0">
              <Link href="/quiz">Browse exams <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <h2 className="font-display text-lg font-extrabold text-ink-900 mb-4">Recent activity</h2>
        {completed.length === 0 ? (
          <Card className="border border-dashed border-border bg-card">
            <CardContent className="py-12 text-center">
              <Zap className="w-9 h-9 text-gold-400 mx-auto mb-3" />
              <p className="font-bold text-ink-900 mb-1">No quizzes yet</p>
              <p className="text-sm text-muted-foreground mb-5">Your practice results and progress will show up here.</p>
              <Button asChild className="rounded-xl font-black">
                <Link href="/quiz"><Globe2 className="w-4 h-4" /> Explore exams</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-border bg-card">
            <CardContent className="p-5 text-sm text-muted-foreground">
              {completed.length} completed quiz{completed.length === 1 ? '' : 'zes'} · average {avg}%
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
