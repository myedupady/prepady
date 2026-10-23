import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { ArrowLeft, Receipt, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAuthContext } from '@/lib/auth'
import { formatNgn } from '@/lib/plans'

export const metadata: Metadata = { title: 'Billing — Prepady' }
export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const { payload, user } = await getAuthContext()
  if (!user) redirect('/login?redirect=/billing')

  const res = await payload
    .find({ collection: 'payments', where: { user: { equals: user.id } }, sort: '-paidAt', limit: 500, depth: 0, overrideAccess: true })
    .catch(() => ({ docs: [] as Array<Record<string, unknown>> }))
  const payments = res.docs

  let spent = 0
  let saved = 0
  for (const p of payments) {
    spent += Number(p.amount) || 0
    saved += Number(p.discountAmount) || 0
  }
  const hasPartner = !!(user as { partnerCode?: string }).partnerCode

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <BrandLogo className="w-7 h-7" /> Prepady<span className="text-gold-500">.</span>
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900"><ArrowLeft className="w-4 h-4" /> Dashboard</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gold-700 mb-1"><Receipt className="w-4 h-4" /> Billing</p>
        <h1 className="font-display text-3xl font-extrabold text-ink-900 mb-1">Your payments</h1>
        <p className="text-muted-foreground mb-8">
          You’ve spent {formatNgn(spent)}{saved > 0 ? ` and saved ${formatNgn(saved)} with your partner discount` : ''}.
          {hasPartner && saved === 0 ? ' Your partner discount applies at checkout on every payment.' : ''}
        </p>

        {payments.length === 0 ? (
          <Card className="border border-dashed border-border bg-card">
            <CardContent className="py-12 text-center">
              <Receipt className="w-9 h-9 text-gold-400 mx-auto mb-3" />
              <p className="font-bold text-ink-900 mb-1">No payments yet</p>
              <p className="text-sm text-muted-foreground mb-5">Upgrade to Premium to unlock everything.</p>
              <Button asChild variant="accent" className="rounded-xl font-black"><Link href="/upgrade"><Sparkles className="w-4 h-4" /> See plans</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-black">Date</th>
                    <th className="px-4 py-3 font-black">Plan</th>
                    <th className="px-4 py-3 font-black text-right">Discount</th>
                    <th className="px-4 py-3 font-black text-right">Paid</th>
                    <th className="px-4 py-3 font-black">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={String(p.id)} className="border-t border-border">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{p.paidAt ? new Date(String(p.paidAt)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{(p.planId as string) ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-muted-foreground">{Number(p.discountAmount) ? `−${formatNgn(Number(p.discountAmount))}` : '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-ink-900">{formatNgn(Number(p.amount) || 0)}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><span className="text-xs font-black uppercase tracking-widest text-success">{String(p.status ?? 'success')}</span></td>
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
