import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { ArrowLeft, Handshake, Users, DollarSign, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getAuthContext } from '@/lib/auth'
import { formatNgn } from '@/lib/plans'
import { relName } from '@/lib/utils'
import { PartnerShare } from './PartnerShare'

export const metadata: Metadata = { title: 'Partner — Prepady' }
export const dynamic = 'force-dynamic'

const firstName = (full?: string | null) => (full ? full.trim().split(/\s+/)[0] : 'Student')

export default async function PartnerPage() {
  const { payload, user } = await getAuthContext()
  if (!user) redirect('/login?redirect=/partner')

  // This page is only for users linked to a partner profile.
  const partnerRes = await payload
    .find({ collection: 'partners', where: { profile: { equals: user.id } }, limit: 1, depth: 0, overrideAccess: true })
    .catch(() => ({ docs: [] as Array<Record<string, unknown>> }))
  const partner = partnerRes.docs[0]
  if (!partner) redirect('/dashboard')

  const code = String(partner.code ?? '')
  const discountLabel = partner.discountType === 'fixed' ? `${formatNgn(Number(partner.discountValue) || 0)} off` : `${Number(partner.discountValue) || 0}% off`
  const shareLabel = partner.revenueShareType === 'fixed' ? `${formatNgn(Number(partner.revenueShareValue) || 0)}/payment` : `${Number(partner.revenueShareValue) || 0}% of each payment`

  const payRes = await payload
    .find({ collection: 'payments', where: { and: [{ partnerProfile: { equals: user.id } }, { status: { equals: 'success' } }] }, sort: '-paidAt', limit: 2000, depth: 1, overrideAccess: true })
    .catch(() => ({ docs: [] as Array<Record<string, unknown>> }))
  const payments = payRes.docs

  // Students referred (signed up with this code).
  const referredRes = await payload
    .find({ collection: 'users', where: { partnerCode: { equals: code } }, limit: 0, depth: 0, overrideAccess: true })
    .catch(() => ({ totalDocs: 0 }))
  const referredCount = (referredRes as { totalDocs?: number }).totalDocs ?? 0

  let revenue = 0
  let earnings = 0
  for (const p of payments) {
    revenue += Number(p.amount) || 0
    earnings += Number(p.partnerShareAmount) || 0
  }

  const tiles = [
    { label: 'Students referred', value: String(referredCount), icon: Users },
    { label: 'Revenue generated', value: formatNgn(revenue), icon: DollarSign },
    { label: 'Your earnings', value: formatNgn(earnings), icon: Wallet },
  ]

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <BrandLogo className="w-7 h-7" /> Prepady<span className="text-gold-500">.</span>
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900"><ArrowLeft className="w-4 h-4" /> Dashboard</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gold-700 mb-1"><Handshake className="w-4 h-4" /> Partner</p>
        <h1 className="font-display text-3xl font-extrabold text-ink-900 mb-1">{String(partner.name ?? 'Your partnership')}</h1>
        <p className="text-muted-foreground mb-8">Students you refer get <b className="text-ink-900">{discountLabel}</b> on every payment. You earn <b className="text-ink-900">{shareLabel}</b>.</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {tiles.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border border-border bg-card shadow-brand">
              <CardContent className="p-5">
                <div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center mb-3"><Icon className="w-4 h-4 text-gold-600" /></div>
                <p className="text-2xl font-black text-ink-900">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <PartnerShare code={code} discountLabel={discountLabel} />

        <h2 className="font-display text-lg font-extrabold text-ink-900 mt-8 mb-4">Your transactions</h2>
        {payments.length === 0 ? (
          <Card className="border border-dashed border-border bg-card"><CardContent className="py-10 text-center text-sm text-muted-foreground">No attributed payments yet. Share your link to get started.</CardContent></Card>
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
                    <th className="px-4 py-3 font-black text-right">Your share</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 50).map((p) => (
                    <tr key={String(p.id)} className="border-t border-border">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{p.paidAt ? new Date(String(p.paidAt)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{firstName(relName(p.user))}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{(p.planId as string) ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-ink-900">{formatNgn(Number(p.amount) || 0)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-gold-700">{formatNgn(Number(p.partnerShareAmount) || 0)}</td>
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
