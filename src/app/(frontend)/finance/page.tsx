import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { ArrowLeft, DollarSign, TicketPercent, Handshake, Receipt } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { BarList, type BarItem } from '@/components/charts/Charts'
import { getAuthContext } from '@/lib/auth'
import { formatNgn } from '@/lib/plans'
import { relName } from '@/lib/utils'

export const metadata: Metadata = { title: 'Finance — Prepady Admin' }
export const dynamic = 'force-dynamic'

export default async function FinancePage() {
  const { payload, user } = await getAuthContext()
  if (!user) redirect('/login?redirect=/finance')
  if ((user as { role?: string }).role !== 'admin') redirect('/dashboard')

  const res = await payload
    .find({ collection: 'payments', where: { status: { equals: 'success' } }, sort: '-paidAt', limit: 5000, depth: 1, overrideAccess: true })
    .catch(() => ({ docs: [] as Array<Record<string, unknown>> }))
  const payments = res.docs

  const now = new Date()
  const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
  const thisMonth = monthKey(now)

  let revenue = 0
  let revenueThisMonth = 0
  let discounts = 0
  let payouts = 0
  const byMonth = new Map<string, number>()
  const byPartner = new Map<string, { revenue: number; share: number }>()

  for (const p of payments) {
    const amt = Number(p.amount) || 0
    revenue += amt
    discounts += Number(p.discountAmount) || 0
    payouts += Number(p.partnerShareAmount) || 0
    const d = p.paidAt ? new Date(String(p.paidAt)) : null
    const mk = d ? monthKey(d) : 'unknown'
    byMonth.set(mk, (byMonth.get(mk) ?? 0) + amt)
    if (mk === thisMonth) revenueThisMonth += amt
    const pname = relName(p.partner)
    if (pname) {
      const m = byPartner.get(pname) ?? { revenue: 0, share: 0 }
      m.revenue += amt
      m.share += Number(p.partnerShareAmount) || 0
      byPartner.set(pname, m)
    }
  }

  // Last 6 months revenue bars.
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    months.push(monthKey(d))
  }
  const monthMax = Math.max(1, ...months.map((m) => byMonth.get(m) ?? 0))
  const monthBars: BarItem[] = months.map((m) => ({
    label: m,
    pct: ((byMonth.get(m) ?? 0) / monthMax) * 100,
    detail: formatNgn(byMonth.get(m) ?? 0),
    tone: 'neutral',
  }))

  const partnerMax = Math.max(1, ...[...byPartner.values()].map((m) => m.revenue))
  const partnerBars: BarItem[] = [...byPartner.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 8)
    .map(([name, m]) => ({ label: name, pct: (m.revenue / partnerMax) * 100, detail: `${formatNgn(m.revenue)} · ${formatNgn(m.share)} owed`, tone: 'good' }))

  const tiles = [
    { label: 'Total revenue', value: formatNgn(revenue), sub: `${payments.length} payments`, icon: DollarSign },
    { label: 'This month', value: formatNgn(revenueThisMonth), sub: thisMonth, icon: Receipt },
    { label: 'Discounts given', value: formatNgn(discounts), sub: 'via partner codes', icon: TicketPercent },
    { label: 'Partner payouts', value: formatNgn(payouts), sub: 'attributed to partners', icon: Handshake },
  ]

  const recent = payments.slice(0, 30)

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <BrandLogo className="w-7 h-7" /> Prepady<span className="text-gold-500">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-sm font-semibold text-muted-foreground hover:text-ink-900">Admin panel</a>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900"><ArrowLeft className="w-4 h-4" /> Dashboard</Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl font-extrabold text-ink-900 mb-1">Finance</h1>
        <p className="text-muted-foreground mb-8">Revenue, discounts and partner payouts across all payments.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {tiles.map(({ label, value, sub, icon: Icon }) => (
            <Card key={label} className="border border-border bg-card shadow-brand">
              <CardContent className="p-5">
                <div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center mb-3"><Icon className="w-4 h-4 text-gold-600" /></div>
                <p className="text-xl font-black text-ink-900">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="border border-border bg-card shadow-brand">
            <CardContent className="p-5">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Revenue · last 6 months</p>
              <BarList items={monthBars} />
            </CardContent>
          </Card>
          <Card className="border border-border bg-card shadow-brand">
            <CardContent className="p-5">
              <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground mb-4"><Handshake className="w-3.5 h-3.5" /> Top partners</p>
              {partnerBars.length ? <BarList items={partnerBars} /> : <p className="text-sm text-muted-foreground">No partner-attributed payments yet.</p>}
            </CardContent>
          </Card>
        </div>

        <h2 className="font-display text-lg font-extrabold text-ink-900 mb-4">Recent transactions</h2>
        {recent.length === 0 ? (
          <Card className="border border-dashed border-border bg-card"><CardContent className="py-10 text-center text-sm text-muted-foreground">No payments yet.</CardContent></Card>
        ) : (
          <Card className="border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-black">Date</th>
                    <th className="px-4 py-3 font-black">Student</th>
                    <th className="px-4 py-3 font-black">Plan</th>
                    <th className="px-4 py-3 font-black text-right">Paid</th>
                    <th className="px-4 py-3 font-black text-right">Discount</th>
                    <th className="px-4 py-3 font-black">Partner</th>
                    <th className="px-4 py-3 font-black text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((p) => (
                    <tr key={String(p.id)} className="border-t border-border">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{p.paidAt ? new Date(String(p.paidAt)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{relName(p.user) ?? (p.email as string) ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{(p.planId as string) ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-ink-900">{formatNgn(Number(p.amount) || 0)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-muted-foreground">{Number(p.discountAmount) ? formatNgn(Number(p.discountAmount)) : '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{relName(p.partner) ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-muted-foreground">{Number(p.partnerShareAmount) ? formatNgn(Number(p.partnerShareAmount)) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </main>
  )
}
